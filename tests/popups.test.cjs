const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
function carregar(file, mocks = {}, cache = new Map()) {
  const p = path.resolve(file);
  if (cache.has(p)) return cache.get(p).exports;
  const mod = { exports: {} }; cache.set(p, mod);
  const code = ts.transpileModule(fs.readFileSync(p, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', code)(r => {
    if (mocks[r]) return mocks[r];
    if (!r.startsWith('.')) return require(r);
    const rel = path.resolve(path.dirname(p), r);
    return carregar(fs.existsSync(rel + '.ts') ? rel + '.ts' : rel + '.tsx', mocks, cache);
  }, mod, mod.exports); return mod.exports;
}
function achar(node, pred) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const n of node) { const v = achar(n, pred); if (v) return v; } return; }
  return pred(node) ? node : achar(node.props?.children, pred);
}

test('confirmação de exclusão usa portal modal, devolve foco e bloqueia ações enquanto exclui', () => {
  let cancelou = 0, confirmou = 0, focou = 0;
  const anterior = global.document;
  global.document = { activeElement:{ isConnected:true, focus() { focou++; } } };
  try {
    const { ConfirmarExclusao } = carregar('src/app/components/plano/camposFormulario.tsx', {
      react:{ ...React, useRef:() => ({ current:null }) },
      '@radix-ui/react-alert-dialog':Object.fromEntries(['Root','Portal','Overlay','Content','Title','Description','Cancel'].map(n => [n,`Alert.${n}`])),
    });
    const props = { titulo:'Excluir risco', descricao:'Preserva as atividades.', aoCancelar() { cancelou++; }, aoConfirmar() { confirmou++; } };
    const livre = ConfirmarExclusao(props);
    assert.ok(achar(livre, n => n.type === 'Alert.Portal'));
    assert.ok(achar(livre, n => n.type === 'Alert.Cancel').props.asChild);
    const content = achar(livre, n => n.type === 'Alert.Content');
    content.props.onOpenAutoFocus();
    content.props.onCloseAutoFocus({ preventDefault() {} });
    assert.equal(focou, 1);
    achar(livre, n => n.type === 'button' && n.props.children === 'Excluir').props.onClick();
    assert.equal(confirmou, 1);
    livre.props.onOpenChange(false); assert.equal(cancelou, 1);
    const ocupado = ConfirmarExclusao({ ...props, ocupado:true, erro:'Sem conexão' });
    ocupado.props.onOpenChange(false);
    let preveniu = false;
    achar(ocupado, n => n.type === 'Alert.Content').props.onEscapeKeyDown({ preventDefault() { preveniu = true; } });
    const excluir = achar(ocupado, n => n.type === 'button' && n.props.children === 'Excluindo…');
    assert.equal(excluir.props.disabled, true); excluir.props.onClick();
    assert.equal(confirmou, 1); assert.equal(cancelou, 1); assert.equal(preveniu, true);
    assert.equal(achar(ocupado, n => n.props.role === 'alert').props.children, 'Sem conexão');
  } finally { global.document = anterior; }
});

test('excluir risco aguarda resposta, evita duplicidade e mantém confirmação após falha', async () => {
  const estados = [], refs = []; let indice = 0, refIndice = 0, fechou = 0, concluir, rejeitar;
  const chamadas = [];
  const Confirmacao = () => null, Painel = () => null, Acao = () => null;
  const { PainelRisco } = carregar('src/app/components/plano/PainelRisco.tsx', {
    react:{ ...React, useState(v) { const i = indice++; if (!(i in estados)) estados[i] = v; return [estados[i], valor => { estados[i] = valor; }]; }, useRef(v) { return refs[refIndice++] ??= { current:v }; } },
    '../../auth/authStore':{ useAuth:() => ({ readOnly:false }) },
    '../../store':{ useStore:() => ({ deleteRisco(id) { chamadas.push(id); return new Promise((resolve,reject) => { concluir = resolve; rejeitar = reject; }); } }) },
    './PainelBase':{ Painel, BotaoAcao:Acao, Linha:() => null, Ausente:() => null },
    './FormularioRisco':{ FormularioRisco:() => null },
    './camposFormulario':{ ConfirmarExclusao:Confirmacao },
    sonner:{ toast:{ success() {} } },
  });
  const render = () => { indice = 0; refIndice = 0; return PainelRisco({ risco:{ id:'r-teste',title:'Teste',severity:6 }, projetoId:1, metas:[], codigos:new Map(), acoesDeResposta:[], aoFechar() { fechou++; } }); };
  achar(achar(render(), n => n.type === Painel).props.acoes, n => n.type === Acao && n.props.perigo).props.aoClicar();
  const confirmar = () => achar(render(), n => n.type === Confirmacao);
  const pendente = confirmar().props.aoConfirmar();
  await confirmar().props.aoConfirmar();
  assert.deepEqual(chamadas, ['r-teste']); assert.equal(fechou, 0);
  assert.equal(confirmar().props.ocupado, true);
  assert.equal(achar(render(), n => n.type === Painel).props.bloqueado, true);
  rejeitar(new Error('Falha de teste')); await pendente;
  assert.equal(confirmar().props.erro, 'Falha de teste'); assert.equal(confirmar().props.ocupado, false); assert.equal(fechou, 0);
  const repetir = confirmar().props.aoConfirmar(); concluir(); await repetir;
  assert.equal(fechou, 1); assert.equal(confirmar(), undefined); assert.equal(chamadas.length, 2);
});

test('pop-up fecha com retorno ao histórico; link direto fecha na própria aplicação', () => {
  let busca = { area:'organizations', org:'org-a', secao:'projeto', projeto:12, aba:'plano' };
  let estado = {}; let voltas = 0; const navegacoes = [];
  const { PopupNavegacao } = carregar('src/app/components/PopupNavegacao.tsx', {
    '@tanstack/react-router': { useSearch: () => busca, useRouterState: () => estado, useRouter: () => ({ history:{ back() { voltas++; } } }), useNavigate: () => op => {
      busca = typeof op.search === 'function' ? op.search(busca) : op.search;
      estado = typeof op.state === 'function' ? op.state(estado) : op.state;
      navegacoes.push(op);
    } },
  });
  const provider = () => PopupNavegacao({ children:null }).props.value;
  provider().mudar('plano-12:atividade:a');
  assert.equal(busca.popup, 'plano-12:atividade:a'); assert.equal(busca.aba, 'plano');
  assert.equal(navegacoes[0].resetScroll, false);
  provider().mudar(null); assert.equal(voltas, 1);
  busca = { ...busca, popup:'rotas:dia:3' }; estado = {};
  provider().mudar(null);
  assert.equal(voltas, 1); assert.equal(busca.popup, undefined);
  assert.equal(navegacoes.at(-1).replace, true, 'Link direto não usa Voltar para fora da aplicação');
});

test('pop-up recupera foco do item de origem e impede fechar durante gravação', () => {
  let focos = 0; let fechou = 0;
  const anterior = global.document;
  global.document = { activeElement: { isConnected:true, focus() { focos++; } } };
  try {
    const { PopupDetalhe } = carregar('src/app/components/PopupDetalhe.tsx', {
      react: { ...React, useRef: () => ({ current:null }) },
      '@radix-ui/react-dialog': Object.fromEntries(['Root','Portal','Overlay','Content','Title','Description','Close'].map(n => [n,`Dialog.${n}`])),
    });
    const arvore = PopupDetalhe({ titulo:'Atividade', descricao:'Projeto', children:'Texto', bloqueado:true, aoFechar() { fechou++; } });
    const content = achar(arvore, e => e.type === 'Dialog.Content');
    content.props.onOpenAutoFocus();
    let evitou = 0;
    content.props.onEscapeKeyDown({ preventDefault() { evitou++; } });
    arvore.props.onOpenChange(false); assert.equal(fechou, 0); assert.equal(evitou, 1);
    content.props.onCloseAutoFocus({ preventDefault() {} }); assert.equal(focos, 1);
    assert.equal(achar(arvore, e => e.type === 'Dialog.Close').props['aria-label'], 'Fechar pop-up');
  } finally { global.document = anterior; }
});

test('painel lateral mantém o plano acessível e permite clicar fora sem fechar; outros pop-ups continuam modais', () => {
  const { PopupDetalhe } = carregar('src/app/components/PopupDetalhe.tsx', {
    react: { ...React, useRef: () => ({ current: null }) },
    '@radix-ui/react-dialog': Object.fromEntries(['Root','Portal','Overlay','Content','Title','Description','Close'].map(n => [n, `Dialog.${n}`])),
  });
  let fechou = 0; let preveniu = 0;
  const painel = PopupDetalhe({ titulo: 'Atividade', descricao: 'Meta › Etapa', apresentacao: 'painel', children: 'Detalhes', aoFechar() { fechou++; } });
  assert.equal(painel.props.modal, false, 'Plano permanece disponível ao lado do detalhe');
  assert.equal(achar(painel, e => e.type === 'Dialog.Overlay'), undefined);
  const conteudo = achar(painel, e => e.type === 'Dialog.Content');
  assert.match(conteudo.props.className, /right-0/);
  assert.doesNotMatch(conteudo.props.className, /translate-x-1\/2/);
  conteudo.props.onPointerDownOutside({ preventDefault() { preveniu++; } });
  conteudo.props.onFocusOutside({ preventDefault() { preveniu++; } });
  assert.equal(preveniu, 2); assert.equal(fechou, 0);
  painel.props.onOpenChange(false); assert.equal(fechou, 1);
  const modal = PopupDetalhe({ titulo: 'Documento', descricao: 'Anexo', children: 'Texto', aoFechar() {} });
  assert.equal(modal.props.modal, true);
  assert.ok(achar(modal, e => e.type === 'Dialog.Overlay'));
});

test('anexo recebe URL assinada e abre visualizador, sem window.open nem redirecionamento', async () => {
  const vistos = []; const erros = [];
  const { abrirAnexo } = carregar('src/app/components/plano/CampoAnexo.tsx', {
    '../../store': {}, '../../auth/authStore': {},
    '../../anexos.server': { urlDoAnexo: async ({ data }) => { if (data.anexoId === 'falha') throw new Error('Sem acesso'); return { url:'https://storage.example/anexo.pdf?token=temporario' }; } },
    '../../lib/visualizacaoDocumento': { visualizarDocumento: d => vistos.push(d) },
    sonner: { toast:{ error:e => erros.push(e) } },
  });
  await abrirAnexo('arquivo', 'Comprovante', 'application/pdf');
  assert.equal(vistos.length, 1); assert.equal(vistos[0].titulo, 'Comprovante');
  await abrirAnexo('falha'); assert.equal(vistos.length, 1); assert.deepEqual(erros, ['Sem acesso']);
});

test('visualizador converte links Google para leitura e recusa protocolos executáveis', () => {
  const { validarDocumento, urlDeVisualizacao } = carregar('src/app/lib/visualizacaoDocumento.ts');
  assert.equal(urlDeVisualizacao('https://docs.google.com/spreadsheets/d/abc-123/edit#gid=1'), 'https://docs.google.com/spreadsheets/d/abc-123/preview#gid=1');
  assert.equal(urlDeVisualizacao('https://drive.google.com/file/d/abc-123/view'), 'https://drive.google.com/file/d/abc-123/preview');
  assert.equal(urlDeVisualizacao('https://storage.example/a.pdf?token=123'), 'https://storage.example/a.pdf?token=123');
  assert.throws(() => validarDocumento({ url:'javascript:alert(1)', titulo:'Arquivo' }), /endereço/);
  assert.throws(() => validarDocumento({ url:'data:text/html,<script>', titulo:'Arquivo' }), /endereço/);
});

test('links externos abrem sobre a tela; URLs privadas não entram na chave de navegação', () => {
  let chave = null; const refs = []; let indice = 0;
  const janelaAnterior = global.window;
  global.window = { location:{ href:'https://inova.example/', origin:'https://inova.example' }, addEventListener() {}, removeEventListener() {} };
  try {
    const Popup = () => null;
    const { VisualizadorDocumentos } = carregar('src/app/components/VisualizadorDocumentos.tsx', {
      react: { ...React, useEffect() {}, useRef(v) { const i = indice++; return refs[i] ??= { current:v }; } },
      './PopupNavegacao': { usePopupChave: () => [chave, v => { chave = v; }] },
      './PopupDetalhe': { PopupDetalhe:Popup },
    });
    const render = () => { indice = 0; return VisualizadorDocumentos({ children:'Tela de origem' }); };
    const link = { href:'https://storage.example/a.pdf?token=privado', target:'_blank', dataset:{}, hasAttribute:()=>false, getAttribute:()=>null, textContent:'Comprovante' };
    let evitou = 0;
    render().props.onClickCapture({ target:{ closest:()=>link }, preventDefault() { evitou++; }, stopPropagation() {} });
    assert.equal(evitou, 1); assert.ok(chave); assert.equal(chave.includes('privado'), false);
    const popup = achar(render(), e => e.type === Popup);
    assert.equal(popup.props.titulo, 'Comprovante'); assert.equal(achar(popup, e => e.type === 'iframe').props.src, link.href);
    popup.props.aoFechar(); assert.equal(chave, null);
  } finally { global.window = janelaAnterior; }
});
