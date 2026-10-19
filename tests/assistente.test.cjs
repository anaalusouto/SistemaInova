const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createHmac } = require('node:crypto');

class NaoAutorizado extends Error {}
function carregar(arquivo, cache = new Map()) {
  const absolute = path.resolve(__dirname, '..', arquivo);
  if (absolute.endsWith('.json')) return JSON.parse(fs.readFileSync(absolute, 'utf8'));
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const mod = { exports: {} }; cache.set(absolute, mod);
  const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === '../sessao.server') return { NaoAutorizado, exigirSessao: async () => { throw new NaoAutorizado(); } };
    if (!name.startsWith('.')) return require(name);
    return carregar(path.resolve(path.dirname(absolute), /\.json$/.test(name) ? name : `${name}.ts`), cache);
  }, mod, mod.exports);
  return mod.exports;
}
const { atenderAssistente } = carregar('src/app/assistant/gateway.server.ts');
const { contextoSeguro, contextoDaNavegacao } = carregar('src/app/assistant/context.ts');
const { validarProtocolo } = carregar('src/app/assistant/protocol.ts');
const env = { INOVA_OPENAI_ENABLED: 'true', INOVA_ASSISTANT_URL: 'http://127.0.0.1:8091', INOVA_ASSISTANT_SECRET: 'local-test-secret-32-characters-long', CHATKIT_DOMAIN_KEY: 'public-test-domain', NODE_ENV: 'development' };
const user = { id: 'u1', login: 'privado@example.test', displayName: 'Não enviar', role: 'visualizador', adminOverride: false };
const input = text => ({ content: [{ type: 'input_text', text }], attachments: [], inference_options: {} });
const pedido = (patch = {}) => ({ type: 'threads.create', params: { input: input('Como preencho?') }, ...patch });
const request = (body = pedido(), headers = {}) => new Request('http://localhost:8080/api/assistente', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:8080', ...headers }, body: JSON.stringify(body) });
const deps = overrides => ({ autenticar: async () => user, env, enviar: async () => Response.json({ ready: true }), ...overrides });

test('sessão é obrigatória mesmo quando conexão está sem configuração', async () => {
  const response = await atenderAssistente(request(), { env: {} });
  assert.equal(response.status, 401);
});
test('sem configuração real responde 503 explícito e não chama provedor', async () => {
  const response = await atenderAssistente(request(), deps({ env: {}, enviar: () => assert.fail('não chamar') }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).configured, false);
});
test('OpenAI fica bloqueada por padrão mesmo com credenciais presentes', async () => {
  const response = await atenderAssistente(request(), deps({ env: { ...env, INOVA_OPENAI_ENABLED: undefined }, enviar: () => assert.fail('não consumir') }));
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /pausada/);
});
test('falha ao validar sessão retorna erro claro e não consulta serviço', async () => {
  const response = await atenderAssistente(request(), deps({ autenticar: async () => { throw new Error('interno'); }, enviar: () => assert.fail() }));
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /interno/);
});
test('origem externa e ausência de Origin são recusadas', async () => {
  for (const origin of ['https://externo.test', 'null', '']) assert.equal((await atenderAssistente(request(pedido(), { origin }), deps())).status, 403);
});
test('contexto só retém chaves estáticas conhecidas; nomes e IDs são descartados', () => {
  assert.deepEqual(contextoSeguro({ tela: 'plano', formulario: 'risco', campo: 'Probabilidade', dados: { cpf: '123' }, projetoId: 1, role: 'admin' }), { tela: 'plano', formulario: 'risco', campo: 'Probabilidade' });
  assert.deepEqual(contextoSeguro({ tela: 'CPF 123', formulario: '__proto__', campo: 'Nome pessoal' }), { tela: 'overview' });
  assert.deepEqual(contextoDaNavegacao({ area: 'organizations', org: 'nome-privado', projeto: 123, aba: 'orcamento', foco: 'id-privado' }), { tela: 'orcamento' });
});
test('metadados não permitem forjar identidade nem injetar o formulário inteiro', () => {
  const result = validarProtocolo(pedido({ metadata: { user: 'outro', role: 'admin', inova: { tela: 'plano', valores: 'segredo' } } }));
  assert.deepEqual(result.metadata, { inova: { tela: 'plano' } });
});
test('ferramentas, ações, uploads, exclusão e seleção de modelo são recusados', () => {
  assert.deepEqual(validarProtocolo(pedido({ params: { input: { ...input('x'), inference_options: { model: null, tool_choice: null } } } })).params.input.inference_options, {});
  for (const type of ['threads.add_client_tool_output', 'threads.custom_action', 'attachments.create', 'threads.delete', 'threads.update', 'input.transcribe']) assert.throws(() => validarProtocolo({ type, params: {} }));
  for (const patch of [{ attachments: ['atc_1'] }, { quoted_text: 'formulário' }, { inference_options: { model: 'outro' } }, { content: [{ type: 'input_tag', text: 'x', data: {} }] }]) assert.throws(() => validarProtocolo(pedido({ params: { input: { ...input('x'), ...patch } } })));
});
test('limita texto, paginação e tamanho do corpo antes do encaminhamento', async () => {
  for (const text of ['', 'x'.repeat(4001)]) assert.equal((await atenderAssistente(request(pedido({ params: { input: input(text) } })), deps())).status, 400);
  assert.throws(() => validarProtocolo({ type: 'threads.list', params: { limit: 500 } }));
  assert.equal((await atenderAssistente(request(pedido({ metadata: { huge: 'x'.repeat(17000) } })), deps())).status, 413);
});
test('assinatura protege corpo e identidade derivada da sessão; visualizador pode conversar', async () => {
  let captured;
  const response = await atenderAssistente(request(pedido({ metadata: { user: 'invasor', inova: { tela: 'orcamento' } } })), deps({ enviar: async (url, init) => { captured = { url, ...init }; return new Response('data: {"type":"thread.created"}\n\n', { headers: { 'content-type': 'text/event-stream' } }); } }));
  assert.equal(response.status, 200);
  assert.match(await response.text(), /thread.created/);
  const h = captured.headers;
  const identity = JSON.parse(Buffer.from(h['X-Inova-Identity'], 'base64url'));
  assert.equal(identity.role, 'visualizador');
  assert.equal(identity.user.length, 64);
  assert.doesNotMatch(JSON.stringify(captured), /privado@example|Não enviar|invasor/);
  assert.equal(h['X-Inova-Signature'], createHmac('sha256', env.INOVA_ASSISTANT_SECRET).update(`${h['X-Inova-Timestamp']}\n${h['X-Inova-Identity']}\n/chatkit\n${captured.body}`).digest('hex'));
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('usuários distintos recebem identidades distintas e ID vem da sessão', async () => {
  const ids = [];
  for (const id of ['u1', 'u2']) await atenderAssistente(request(), deps({ autenticar: async () => ({ ...user, id }), enviar: async (_, init) => { ids.push(init.headers['X-Inova-Identity']); return Response.json({}); } }));
  assert.notEqual(ids[0], ids[1]);
});
test('saúde divulga só a chave pública de domínio e requer serviço pronto', async () => {
  const response = await atenderAssistente(new Request('http://localhost:8080/api/assistente'), deps());
  assert.deepEqual(await response.json(), { message: 'Assistente disponível.', configured: true, domainKey: env.CHATKIT_DOMAIN_KEY });
});
test('falhas e limites do backend viram mensagens seguras', async () => {
  for (const status of [404, 429, 503, 500]) {
    const response = await atenderAssistente(request(), deps({ enviar: async () => new Response('segredo do provedor', { status }) }));
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.doesNotMatch(await response.text(), /segredo/);
  }
  assert.equal((await atenderAssistente(request(), deps({ enviar: async () => { throw new Error('segredo'); } }))).status, 503);
});
test('produção recusa transporte HTTP e configuração com credenciais na URL', async () => {
  for (const url of ['http://127.0.0.1:8091', 'https://user:pass@backend.test', 'https://backend.test/path']) assert.equal((await atenderAssistente(request(), deps({ env: { ...env, INOVA_ASSISTANT_URL: url, NODE_ENV: 'production' }, enviar: () => assert.fail() }))).status, 503);
});
