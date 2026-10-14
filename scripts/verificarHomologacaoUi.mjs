// Auditoria SOMENTE LEITURA dos registros sintéticos usados na homologação visual.
// Não comprova permissões de usuário: esta conexão administrativa é apenas para releitura.
import { loadEnv } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
const env = loadEnv('development', process.cwd(), '');
const base = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error('Conexão administrativa de leitura não configurada.');
const headers = { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }) };
async function ler(tabela, parametros) {
  const resposta = await fetch(`${base}/rest/v1/${tabela}?${new URLSearchParams(parametros)}`, { headers, signal: AbortSignal.timeout(20000) });
  if (!resposta.ok) throw new Error(`Leitura de ${tabela} recusada (${resposta.status}).`);
  return resposta.json();
}
const [org] = await ler('comunidades', { select: 'id,code,nome', code: 'eq.HOMOLOG-AT-20261005' });
if (!org) throw new Error('Organização sintética de homologação não encontrada.');
const projetos = await ler('projetos', { select: 'id,code,comunidade_id,drive_link', comunidade_id: `eq.${org.id}` });
if (projetos.length !== 1 || projetos[0].code !== 'HOMOLOG-AT-PROJ-20261005') throw new Error('Vínculo da organização de teste não corresponde ao esperado.');
const projeto = projetos[0];
const metas = await ler('metas', { select: 'id,nome,ordem', projeto_id: `eq.${projeto.id}` });
const etapas = metas.length ? await ler('etapas', { select: 'id,meta_id,nome,ordem', meta_id: `in.(${metas.map(m => m.id).join(',')})` }) : [];
const [atividades, riscos, mudancas, pareceres, anexos, registros, notas] = await Promise.all([
  etapas.length ? ler('atividades', { select: 'id,etapa_id,nome,inicio_realizado,fim_realizado,justificativa_atraso,responsavel,status,excluido_em', etapa_id: `in.(${etapas.map(e => e.id).join(',')})` }) : [],
  ler('plano_riscos', { select: 'id,status', projeto_id: `eq.${projeto.id}` }),
  ler('mudancas', { select: 'id', projeto_id: `eq.${projeto.id}` }),
  ler('pareceres_tecnicos', { select: 'id,projeto_id,log_comunicacao_id', projeto_id: `eq.${projeto.id}` }),
  ler('projeto_anexos', { select: 'id,projeto_id,log_comunicacao_id,nome_arquivo', projeto_id: `eq.${projeto.id}` }),
  ler('logs_comunicacao', { select: 'id,comunidade_id,assunto', comunidade_id: `eq.${org.id}` }),
  ler('organizacao_notas', { select: 'id,comunidade_id,versao', comunidade_id: `eq.${org.id}` }),
]);
const evidencia = {
  dataUTC: new Date().toISOString(), ambienteBanco: new URL(base).host, verificador: 'Codex, REST administrativo somente leitura',
  limite: 'Complementa a evidência de interface; não substitui teste real de perfil nem aceite de negócio.',
  organizacao: org, projeto, metas, etapas, atividades, riscos, mudancas, pareceres, anexos, registros, notas,
  contadores: { riscosAbertos: riscos.filter(r => r.status !== 'Encerrado').length, riscosTotais: riscos.length, mudancas: mudancas.length },
  atividadeRestaurada: atividades.length === 1 && atividades[0].inicio_realizado === null && atividades[0].fim_realizado === null && !atividades[0].justificativa_atraso,
};
if (process.argv.includes('--auditar-links')) {
  const projetos = await ler('projetos', { select: 'id,code,drive_link,budget_link,termo_fomento_link' });
  const alvos = projetos.flatMap(p => ['drive_link', 'budget_link', 'termo_fomento_link'].filter(campo => p[campo]).map(campo => ({ projetoId: p.id, codigo: p.code, campo, url: p[campo] })));
  // Alvos temporários para ensaiar a abertura no navegador autenticado, sem publicar URLs de documentos no relatório.
  await mkdir('node_modules/.cache/homologacao-ui', { recursive: true });
  await writeFile('node_modules/.cache/homologacao-ui/links.json', JSON.stringify(alvos));
  evidencia.linksCadastrados = projetos.flatMap(p => ['drive_link', 'budget_link', 'termo_fomento_link'].filter(campo => p[campo]).map(campo => {
    try { return { projetoId: p.id, codigo: p.code, campo, dominio: new URL(p[campo]).hostname, urlValida: true }; }
    catch { return { projetoId: p.id, codigo: p.code, campo, urlValida: false }; }
  }));
  console.log(JSON.stringify({ projetosConsultados: projetos.length, linksCadastrados: evidencia.linksCadastrados }));
}
const pasta = 'docs/evidencias/homologacao-20261014';
await mkdir(pasta, { recursive: true });
await writeFile(`${pasta}/releitura-banco.json`, JSON.stringify(evidencia, null, 2) + '\n');
console.log(JSON.stringify({ organizacaoId: org.id, projetoId: projeto.id, atividadeIds: atividades.map(a => a.id), contadores: evidencia.contadores,
  atividadeRestaurada: evidencia.atividadeRestaurada, arquivo: `${pasta}/releitura-banco.json` }));
