import { loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

// Credenciais ficam apenas em memória e nunca aparecem nos resultados.
// O preflight é somente leitura; a execução dos cenários é uma etapa separada.
const env = loadEnv('development', process.cwd(), '');
const base = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error('Conexão de servidor não configurada.');
const headers = { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }) };

async function rest(tabela, query, method = 'GET', body, erroEsperado = false) {
  const response = await fetch(`${base}/rest/v1/${tabela}?${query}`, {
    method, headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const resultado = await response.json();
  if (erroEsperado) return { status: response.status, codigo: resultado.code, resultado };
  if (!response.ok) throw new Error(`Leitura de ${tabela} recusada (${response.status}; ${resultado.code ?? 'sem código'}).`);
  return resultado;
}

const evidencePath = 'docs/evidencias/at-banco.json';
const evidencia = { ambiente: new URL(base).host, verificador: 'Codex via REST administrativo', inicioUTC: new Date().toISOString(),
  limite: 'Não comprova login, autorização dos perfis ou reload da interface. Somente dados sintéticos são escritos. Nenhum registro é excluído.',
  ids: {}, resultados: [] };
async function guardar() {
  await mkdir('docs/evidencias', { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidencia, null, 2)}\n`, 'utf8');
}
function registrar(item, resultado, dados = {}) { evidencia.resultados.push({ item, resultado, ...dados, dataUTC: new Date().toISOString() }); }
const hash = valor => createHash('sha256').update(JSON.stringify(valor)).digest('hex');
const tabelas = ['comunidades', 'projetos', 'contatos', 'logs_comunicacao', 'organizacao_notas', 'metas', 'etapas', 'atividades', 'plano_riscos', 'orcamento_itens', 'orcamento_notas', 'log_alteracoes_meta', 'pareceres_tecnicos', 'projeto_anexos'];
async function snapshot() {
  return Object.fromEntries(await Promise.all(tabelas.map(async tabela => {
    const rows = [];
    for (let offset = 0; ; offset += 1000) {
      const pagina = await rest(tabela, `select=*&order=id&limit=1000&offset=${offset}`);
      rows.push(...pagina);
      if (pagina.length < 1000) break;
    }
    return [tabela, new Map(rows.map(r => [String(r.id), hash(r)]))];
  })));
}
async function garantir(tabela, chave, filtro, dados) {
  const existentes = await rest(tabela, `select=*&${filtro}`);
  if (existentes.length > 1) throw new Error(`Conflito nos registros de teste: ${tabela}.`);
  const row = existentes[0] ?? (await rest(tabela, 'select=*', 'POST', dados))[0];
  evidencia.ids[chave] = row.id;
  await guardar();
  return row;
}
async function conferirBloqueio(item, tabela, metodo, filtro, dados, codigo) {
  const resposta = await rest(tabela, filtro, metodo, dados, true);
  if (resposta.status < 400 || resposta.codigo !== codigo) {
    registrar(item, 'FALHA', { status: resposta.status, codigo: resposta.codigo ?? null, idsRetornados: Array.isArray(resposta.resultado) ? resposta.resultado.map(r => r.id) : [] });
    await guardar();
    throw new Error(`Bloqueio ${item} não confirmado. Dados de teste preservados para correção.`);
  }
  registrar(item, 'CONFORME no banco', { status: resposta.status, codigo: resposta.codigo });
  await guardar();
}

async function executar() {
  const antes = await snapshot();
  const org = await garantir('comunidades', 'organizacao', 'code=eq.HOMOLOG-AT-20261005', {
    code: 'HOMOLOG-AT-20261005', nome: 'HOMOLOGAÇÃO AT — organização de teste',
    tipo: 'Associação', segmento_social: 'Agricultura Familiar', uf: 'PA', status: 'Prospectada',
    observacoes: 'Dados sintéticos para AT-023/025/047. Não representa organização da operação.',
  });
  const project = await garantir('projetos', 'projeto', `comunidade_id=eq.${org.id}`, {
    comunidade_id: org.id, code: 'HOMOLOG-AT-PROJ-20261005', nome: 'HOMOLOGAÇÃO AT — projeto de teste',
    org: 'HOMOLOGAÇÃO AT', status: 'Não iniciado', objetivo: 'Verificar persistência sem alterar registros da operação.',
    data_inicio: '2026-10-01', data_fim: '2026-10-31', drive_link: 'https://example.org/',
  });
  if (project.code !== 'HOMOLOG-AT-PROJ-20261005') throw new Error('Projeto da organização de teste não reconhecido; escrita interrompida.');
  await conferirBloqueio('AT-025 segundo projeto', 'projetos', 'POST', 'select=id', {
    comunidade_id: org.id, nome: 'HOMOLOGAÇÃO AT — tentativa de segundo projeto', code: 'HOMOLOG-AT-DUPLICADO',
  }, '23505');
  await conferirBloqueio('Vínculo obrigatório', 'projetos', 'POST', 'select=id', {
    comunidade_id: null, nome: 'HOMOLOGAÇÃO AT — tentativa sem vínculo', code: 'HOMOLOG-AT-SEM-VINCULO',
  }, '23514');
  await conferirBloqueio('Vínculo imutável', 'projetos', 'PATCH', `id=eq.${project.id}&select=id`, { comunidade_id: null }, '23514');
  const registro = await garantir('logs_comunicacao', 'registroContato', `comunidade_id=eq.${org.id}&assunto=eq.HOMOLOGAÇÃO AT`, {
    comunidade_id: org.id, projeto_id: project.id, data: '2026-10-05', assunto: 'HOMOLOGAÇÃO AT',
    participantes: ['Equipe de homologação (teste)'], resumo: 'Registro sintético inicial.', meio: 'Outro',
  });
  const nota = await garantir('organizacao_notas', 'nota', `comunidade_id=eq.${org.id}`, {
    comunidade_id: org.id, conteudo: 'HOMOLOGAÇÃO AT — nota inicial.', criado_por: 'Homologação', atualizado_por: 'Homologação',
  });
  const meta = await garantir('metas', 'meta', `projeto_id=eq.${project.id}`, { projeto_id: project.id, nome: 'HOMOLOGAÇÃO AT — meta', ordem: 1 });
  const etapa = await garantir('etapas', 'etapa', `meta_id=eq.${meta.id}`, {
    meta_id: meta.id, nome: 'HOMOLOGAÇÃO AT — etapa', ordem: 1, inicio_previsto: '2026-10-01', fim_previsto: '2026-10-31',
  });
  await garantir('atividades', 'atividade', `etapa_id=eq.${etapa.id}`, {
    etapa_id: etapa.id, nome: 'HOMOLOGAÇÃO AT — atividade', responsavel: 'Equipe de teste', ordem: 1, status: 'A iniciar', progresso: 0,
    inicio_previsto: '2026-10-10', fim_previsto: '2026-10-20',
  });
  await garantir('plano_riscos', 'risco', `projeto_id=eq.${project.id}`, {
    projeto_id: project.id, etapa_id: etapa.id, titulo: 'HOMOLOGAÇÃO AT — risco', descricao: 'Risco sintético para conferir preservação.',
    probabilidade: 1, impacto: 1, categoria: 'Operacional', status: 'Encerrado',
  });
  await garantir('orcamento_itens', 'orcamento', `projeto_id=eq.${project.id}`, {
    projeto_id: project.id, item: 'HOMOLOGAÇÃO AT — item sem valor financeiro', qtd: 1, qtd_unidades: 1, valor_unitario: 0,
  });
  const parecer = await garantir('pareceres_tecnicos', 'parecer', `projeto_id=eq.${project.id}`, {
    projeto_id: project.id, log_comunicacao_id: registro.id, data: '2026-10-05', origem: 'Outro', autor: 'Equipe de teste',
    pontos_observados: 'Parecer sintético preservado; acesso antigo não deve reaparecer.',
  });
  const conteudo = 'HOMOLOGAÇÃO AT — nota editada e relida.';
  const resumo = 'HOMOLOGAÇÃO AT — registro editado e relido.';
  await rest('organizacao_notas', `id=eq.${nota.id}&comunidade_id=eq.${org.id}`, 'PATCH', { conteudo, versao: nota.versao + 1, atualizado_por: 'Homologação' });
  await rest('logs_comunicacao', `id=eq.${registro.id}&comunidade_id=eq.${org.id}`, 'PATCH', { resumo });
  const notaRelida = (await rest('organizacao_notas', `select=*&id=eq.${nota.id}`))[0];
  const registroRelido = (await rest('logs_comunicacao', `select=*&id=eq.${registro.id}`))[0];
  if (notaRelida.conteudo !== conteudo || registroRelido.resumo !== resumo || notaRelida.comunidade_id !== org.id || registroRelido.comunidade_id !== org.id) throw new Error('Falha na releitura dos dados de teste.');
  const parecerRelido = (await rest('pareceres_tecnicos', `select=id,projeto_id,log_comunicacao_id&id=eq.${parecer.id}`))[0];
  if (parecerRelido.projeto_id !== project.id || parecerRelido.log_comunicacao_id !== registro.id) throw new Error('Vínculo do parecer não preservado.');
  registrar('AT-047 registros, nota e parecer', 'CONFORME em gravação/releitura REST; reload da interface pendente', { notaId: nota.id, registroId: registro.id, parecerId: parecer.id });
  // PNG sintético de 1 pixel; somente um arquivo novo no bucket já existente.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  const storagePath = `homologacao-at/${org.id}/anexo-teste.png`;
  let anexo = (await rest('projeto_anexos', `select=*&projeto_id=eq.${project.id}&log_comunicacao_id=eq.${registro.id}`))[0];
  if (!anexo) {
    const upload = await fetch(`${base}/storage/v1/object/projeto-anexos/${storagePath}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'image/png', 'x-upsert': 'false' }, body: png, signal: AbortSignal.timeout(15000) });
    if (!upload.ok && upload.status !== 409) throw new Error(`Upload de anexo de teste recusado (${upload.status}).`);
    anexo = await garantir('projeto_anexos', 'anexo', `storage_path=eq.${storagePath}`, {
      projeto_id: project.id, log_comunicacao_id: registro.id, storage_path: storagePath, nome_arquivo: 'HOMOLOGACAO-AT.png', tipo_mime: 'image/png', tamanho_bytes: png.length, enviado_por: 'Homologação',
    });
  }
  evidencia.ids.anexo = anexo.id;
  const sign = await fetch(`${base}/storage/v1/object/sign/projeto-anexos/${anexo.storage_path}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60 }), signal: AbortSignal.timeout(15000) });
  if (!sign.ok) throw new Error(`Assinatura de anexo recusada (${sign.status}).`);
  const signed = (await sign.json()).signedURL;
  const download = await fetch(`${base}/storage/v1${signed}`, { signal: AbortSignal.timeout(15000) });
  if (!download.ok || hash(Buffer.from(await download.arrayBuffer()).toString('base64')) !== hash(png.toString('base64'))) throw new Error('Anexo não recuperado integralmente.');
  registrar('AT-047 anexo', 'CONFORME no Storage com URL assinada; acesso pela interface/perfil pendente', { anexoId: anexo.id, bytes: png.length });
  const projetoRelido = (await rest('projetos', `select=id,comunidade_id,drive_link&id=eq.${project.id}`))[0];
  if (projetoRelido.drive_link !== 'https://example.org/' || projetoRelido.comunidade_id !== org.id) throw new Error('Link ou vínculo não preservado.');
  registrar('AT-047 link', 'URL sintética preservada; abertura de links reais da operação não verificada', { projetoId: project.id });
  const depois = await snapshot();
  const alterados = [];
  const fixtureIds = new Set(Object.values(evidencia.ids).map(String));
  for (const tabela of tabelas) {
    for (const [id, digest] of antes[tabela]) {
      if (!fixtureIds.has(id) && depois[tabela].get(id) !== digest) alterados.push({ tabela, id, resultado: depois[tabela].has(id) ? 'alterado durante a janela' : 'não encontrado após teste' });
    }
  }
  registrar('AT-023 preservação', alterados.length ? 'INCONCLUSIVO: conferir alterações concorrentes' : 'CONFORME nos registros preexistentes comparados', {
    totaisAntes: Object.fromEntries(tabelas.map(t => [t, antes[t].size])),
    totaisDepois: Object.fromEntries(tabelas.map(t => [t, depois[t].size])), alterados,
  });
  evidencia.fimUTC = new Date().toISOString();
  await guardar();
  console.log(JSON.stringify({ modo: 'executar', ambiente: evidencia.ambiente, ids: evidencia.ids, resultados: evidencia.resultados.map(({ item, resultado }) => ({ item, resultado })), evidencia: evidencePath }));
}

try {
  const orgs = await rest('comunidades', 'select=id,code,mapeamento_relatorio_url,parecer_relatorio_url&code=eq.HOMOLOG-AT-20261005');
  console.log(JSON.stringify({ modo: 'preflight', ambiente: new URL(base).host, campos0019Disponiveis: true, organizacoesTesteEncontradas: orgs.map(o => ({ id: o.id, code: o.code })) }));
  if (process.argv.includes('--auditar-vinculos')) {
    const projetos = await rest('projetos', 'select=id,comunidade_id&order=id');
    const porOrg = new Map();
    for (const p of projetos) if (p.comunidade_id) porOrg.set(p.comunidade_id, [...(porOrg.get(p.comunidade_id) ?? []), p.id]);
    const auditoria = {
      ambiente: new URL(base).host, dataUTC: new Date().toISOString(), verificador: 'Codex, somente leitura REST',
      quantidadeProjetos: projetos.length,
      conflitos: [...porOrg].filter(([, ids]) => ids.length > 1).map(([organizacaoId, projetoIds]) => ({ organizacaoId, projetoIds })),
      projetosSemOrganizacao: projetos.filter(p => !p.comunidade_id).map(p => p.id),
    };
    await mkdir('docs/evidencias', { recursive: true });
    await writeFile('docs/evidencias/at-vinculos.json', `${JSON.stringify(auditoria, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify(auditoria));
  }
  if (process.argv.includes('--executar')) await executar();
} catch (erro) {
  if (process.argv.includes('--executar')) { registrar('Execução', 'INTERROMPIDA', { motivo: erro.message }); await guardar(); }
  console.error(erro.message === 'fetch failed' ? 'Falha de rede ao acessar a conexão configurada.' : erro.message);
  process.exitCode = 1;
}
