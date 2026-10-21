/** Copiado do protótipo indicado no slide 3. Códigos Fxx não reutilizam IDs legados. */
export const FUNCOES_MATRIZ = [
  ['F01','Representação e articulação institucional','Representação, Identidade e Território'],
  ['F02','Valorização cultural','Representação, Identidade e Território'],
  ['F03','Fortalecimento de saberes e práticas tradicionais','Representação, Identidade e Território'],
  ['F04','Organização e planejamento da produção','Produção'],
  ['F05','Assistência/orientação técnica','Produção'],
  ['F07','Compra coletiva de insumos','Produção'],
  ['F08','Disponibilização de máquinas/equipamentos','Produção'],
  ['F06','Capacitação em gestão e desenvolvimento organizacional','Gestão e recursos'],
  ['F20','Captação de recursos/projetos','Gestão e recursos'],
  ['F21','Gestão de projetos','Gestão e recursos'],
  ['F09','Beneficiamento','Beneficiamento e qualidade'],
  ['F10','Armazenamento','Beneficiamento e qualidade'],
  ['F11','Controle de qualidade','Beneficiamento e qualidade'],
  ['F12','Padronização','Beneficiamento e qualidade'],
  ['F13','Regularização/certificação','Beneficiamento e qualidade'],
  ['F14','Comercialização em mercado privado e canais voluntários','Mercado'],
  ['F15','Comercialização em políticas públicas','Mercado'],
  ['F16','Formação/orientação de preços','Mercado'],
  ['F17','Transporte/logística','Mercado'],
  ['F18','Gestão de marca','Mercado'],
  ['F19','Divulgação/promoção de produtos','Mercado'],
].map(([id,nome,grupo])=>({id,nome,grupo}));
export const ATUACAO_MATRIZ = ['Não realiza','Executa','Viabiliza','Viabiliza e executa'] as const;
export const EXPERIENCIA_MATRIZ = ['Não está acontecendo','Inicial','Recorrente'] as const;
export const NIVEIS_MATRIZ = ['1','2','3','4'] as const;
export interface MatrizPrototipoInput {
  organizacaoId: string; diagnosticoId: string; funcaoId: string; nomeFuncao: string;
  atuacao: string | null; experiencia: string | null; criticidade: string | null;
  interesse: string | null; observacoes: string | null; externo: string | null;
}
export function leituraMatriz(criticidade: string | null, experiencia: string | null): string {
  if(!NIVEIS_MATRIZ.includes(criticidade as '1') || !EXPERIENCIA_MATRIZ.includes(experiencia as 'Inicial')) return 'Completar avaliação';
  if(experiencia==='Recorrente') return 'Acompanhar';
  const c=Number(criticidade);
  if(experiencia==='Inicial') return c===4?'Lacuna crítica':c===3?'Lacuna relevante':'Melhoria pontual';
  return c>=3?'Lacuna crítica':c===2?'Melhoria pontual':'Acompanhar';
}
export function validarMatrizPrototipo(d: MatrizPrototipoInput): void {
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(!d || !uuid.test(d.organizacaoId) || !uuid.test(d.diagnosticoId) || !FUNCOES_MATRIZ.some(f=>f.id===d.funcaoId)) throw new Error('Selecione a organização, a aplicação e uma função válida da Matriz.');
  if(typeof d.nomeFuncao!=='string' || !d.nomeFuncao.trim() || d.nomeFuncao.length>500) throw new Error('Informe o nome da função (até 500 caracteres).');
  for(const [valor,opcoes] of [[d.atuacao,ATUACAO_MATRIZ],[d.experiencia,EXPERIENCIA_MATRIZ],[d.criticidade,NIVEIS_MATRIZ],[d.interesse,NIVEIS_MATRIZ]] as const)
    if(valor!==null && !(opcoes as readonly string[]).includes(valor)) throw new Error('Escolha uma das opções da Matriz.');
  for(const texto of [d.observacoes,d.externo]) if(texto!==null && (typeof texto!=='string' || texto.length>20000)) throw new Error('Observação e Externo aceitam até 20.000 caracteres.');
}
