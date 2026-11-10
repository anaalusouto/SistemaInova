import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Sprout } from "lucide-react";
import { getParecer, salvarConclusaoTecnica, listarProdutos, listarRespostasMatriz } from "../../diagnosticos.server";
import { useFichaOrganizacao } from "../organizacoes/useOrganizacoes";
import { DocumentosRegistro } from "../DocumentosRegistro";
import { PopupDetalhe } from "../PopupDetalhe";
import { formatDateOnly } from "../../lib/dateOnly";
import { useCaderno } from "./CadernoItens";
import { calcularIeoCaderno, DIMENSOES_IEO_CADERNO } from "../../diagnostic/ieoCaderno";
import { AGROMEL_ID_REAVALIACAO_IEO, ieoAguardandoReavaliacao } from "../../diagnostic/validadeIeoCaderno";
import { calcularNotaConsolidada } from '../../diagnostic/notaConsolidada';
import { FUNCOES_MATRIZ, leituraMatriz } from '../../diagnostic/catalog/matrizPrototipo';
import {
  camposDaPrioridade,
  ordenarDimensoes,
  pendenciaDeRemapeamento,
  prioridadesDoCaderno,
  trechoExecutivo,
} from "../../diagnostic/resumoDiagnostico";

const nota = (valor: number | null) =>
  valor === null
    ? "Sem nota"
    : valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const DIMENSOES_HISTORICAS_AGROMEL = [
  { ordem: 1, prioridade: 'Crítica', dimensao: 'Organizacional e Governança', descricao: 'Decisões, responsabilidades, lideranças e acompanhamento do planejamento.', ieo: '1,2', matriz: '1,0', cesta: '—', consolidada: '1,1', formula: '(50% × IEO + 25% × Matriz) ÷ 75%' },
  { ordem: 2, prioridade: 'Crítica', dimensao: 'Social e Território', descricao: 'Participação dos membros, comunicação, benefícios coletivos, cultura, parceiros e território.', ieo: '1,2', matriz: '2,0', cesta: '—', consolidada: '1,5', formula: '(50% × IEO + 25% × Matriz) ÷ 75%' },
  { ordem: 3, prioridade: 'Média', dimensao: 'Produção e Negócio', descricao: 'Produção, recursos, logística, qualidade e atuação comercial.', ieo: '1,4', matriz: '1,9', cesta: '2,0', consolidada: '1,7', formula: '50% × IEO + 25% × Matriz + 25% × Cesta' },
  { ordem: 4, prioridade: 'Média', dimensao: 'Gestão Econômico-financeira', descricao: 'Registros, planejamento e administração de recursos, prestação de contas e continuidade financeira.', ieo: '1,8', matriz: '2,0', cesta: '—', consolidada: '1,9', formula: 'Redistribuir os pesos entre os componentes disponíveis' },
  { ordem: 5, prioridade: 'Média', dimensao: 'Regularidade e Gestão de Riscos', descricao: 'Exigências, prevenção e resposta a riscos, dependências e conflitos.', ieo: '1,7', matriz: '3,0', cesta: '2,5', consolidada: '2,2', formula: '50% × IEO + 25% × Matriz + 25% × Cesta' },
];

const PRIORIDADES_AGROMEL = [
  { codigo: 'PRIO1', titulo: 'Engajamento dos cooperados', resultado: 'Ampliar participação, distribuir responsabilidades e fortalecer a capacidade de substituição, incluindo membros distantes e menos participativos.', obstaculo: 'Participação desigual, concentração de funções e barreiras territoriais/logísticas.', apoio: 'Capacitação em gestão, mecanismos de participação e comunicação, organização das responsabilidades.', publico: 'Cooperados, com atenção aos grupos menos participativos.', dimensoes: 'Organizacional e Governança; Social e Território.' },
  { codigo: 'PRIO2', titulo: 'Capital de giro', resultado: 'Aumentar a capacidade de sustentar operações e absorver diferenças de prazo, reduzindo dependência de projetos e pagamentos específicos.', obstaculo: 'Ausência de reserva/capital de giro próprio e planejamento financeiro pouco estruturado; a necessidade de pagamento imediato aos cooperados favorece vendas a atravessadores e reduz insumos para processamento coletivo.', apoio: 'Estruturação de custos, planejamento financeiro e busca de alternativas de capital de giro.', publico: 'Organização e cooperados participantes das operações.', dimensoes: 'Organizacional e Governança; Gestão Econômico-financeira; Produção e Negócio.' },
  { codigo: 'PRIO3', titulo: 'Comercialização Coletiva', resultado: 'Ampliar e diversificar mercados e canais coletivos, garantir certificação e qualidade padronizada, reduzir dependência da CONAB e melhorar acesso a compradores.', obstaculo: 'Dependência de canal específico, prospecção pouco estruturada, logística heterogênea, custos e margens pouco conhecidos e baixa visibilidade das vendas individuais.', apoio: 'Prospecção de mercados, formação de preços, logística, marca/apresentação de mel e frutas e organização da oferta.', publico: 'Cooperados e produtos das operações coletivas atuais e futuras.', dimensoes: 'Produção e Negócio.' },
];
type Dimensao = {
  dimensaoId: string;
  dimensaoTitulo: string;
  codigos?: string[];
  media: number | null;
  respondidas: number;
  pontuadas?: number;
  total: number;
};

function DimensoesResumo({
  dimensoes,
  historico,
  rotulo,
  onConsultarIeo,
  parte,
}: {
  dimensoes: Dimensao[];
  historico?: boolean;
  rotulo: string;
  onConsultarIeo?: () => void;
  parte: 'grafico' | 'detalhes';
}) {
  const ordenadas = ordenarDimensoes(dimensoes);
  return (
    <div className="resumo-dimensoes">
      {parte === 'grafico' && <figure className="resumo-cartao resumo-grafico">
        <figcaption>
          <h5>Prioridades por dimensão</h5>
          <p className="resumo-etiqueta">{rotulo}</p>
          <p>
            Quanto menor a nota, maior a prioridade de análise. Notas iguais compartilham a mesma
            ordem.
          </p>
        </figcaption>
        <ol className="resumo-barras">
          {ordenadas.map((d) => (
            <li key={d.dimensaoId}>
              <div className="resumo-barra-rotulo">
                <span>
                  <strong>{d.ordem === null ? "—" : `${d.ordem}º`}</strong> · {d.dimensaoTitulo}
                </span>
                <strong>
                  {nota(d.media)}
                  {d.media !== null && " / 4"}
                </strong>
              </div>
              <div className="resumo-barra-trilho" aria-hidden="true">
                {d.media !== null && (
                  <span style={{ width: `${Math.max(0, Math.min(100, (d.media / 4) * 100))}%` }} />
                )}
              </div>
            </li>
          ))}
        </ol>
        <p>
          As prioridades estratégicas são pactuadas com a organização; esta ordenação não as define
          automaticamente.
        </p>
      </figure>}
      {parte === 'detalhes' && <details className="resumo-expansivel"><summary>Ver prioridades dimensionais</summary><div className="resumo-cartao resumo-tabela-container">
        <table className="resumo-tabela">
          <caption>Prioridades dimensionais · {rotulo}</caption>
          <thead>
            <tr>
              <th scope="col">Ordem / prioridade</th>
              <th scope="col">Dimensão e descrição</th>
              <th scope="col">IEO / 4</th>
              <th scope="col">Matriz / 4</th>
              <th scope="col">Cesta / 4</th>
              <th scope="col">Consolidada / 4</th>
              <th scope="col">Fórmula aplicada</th>
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((d) => (
              <tr key={d.dimensaoId}>
                <th scope="row" data-label="Ordem / prioridade">
                  {d.ordem === null ? "Sem ordem calculável" : `${d.ordem}ª prioridade`}
                </th>
                <td data-label="Dimensão e descrição">
                  <strong>{d.dimensaoTitulo}</strong><br />
                  Indicadores: {d.codigos?.join(", ") || "Não registrados"}
                </td>
                <td data-label="IEO / 4">
                  <strong>{d.media === null ? "Sem nota" : nota(d.media)}</strong><br />
                  {d.pontuadas ?? d.respondidas}/{d.total} com nota
                </td>
                <td data-label="Matriz / 4">Não registrado por dimensão</td>
                <td data-label="Cesta / 4">Não registrado por dimensão</td>
                <td data-label="Consolidada / 4">Não calculável por dimensão</td>
                <td data-label="Fórmula aplicada">Não aplicada por dimensão: os componentes estão consolidados somente no total geral.</td>
              </tr>
            ))}
          </tbody>
        </table>
        <details className="resumo-expansivel">
          <summary>Consultar composição e registros usados</summary>
          <div>
            <ul>
              {ordenadas.map((d) => (
                <li key={d.dimensaoId}>
                  <strong>{d.dimensaoTitulo}:</strong> {d.respondidas}/{d.total} perguntas
                  respondidas · {d.pontuadas ?? d.respondidas} com nota · média simples dos níveis válidos.
                </li>
              ))}
            </ul>
            <p>
              A cobertura inclui marcações sem pontuação. Notas de Matriz e Cesta por dimensão não estão registradas; a consolidação existente é geral. Consulte as respostas do IEO e os vínculos da aplicação para conferir a composição.
            </p>
            {onConsultarIeo && <button type="button" className="resumo-acao" onClick={onConsultarIeo}>Abrir perguntas e vínculos do IEO</button>}
          </div>
        </details>
      </div></details>}
    </div>
  );
}

function PrioridadesDimensionaisHistoricasAgromel({ onConsultarIeo, parte }: { onConsultarIeo?: () => void; parte: 'grafico' | 'detalhes' }) {
  const chartWidth = 1080;
  const chartHeight = 470;
  const left = 82;
  const right = 28;
  const top = 28;
  const baseline = 335;
  const plotHeight = baseline - top;
  const plotWidth = chartWidth - left - right;
  const x = (index: number) => left + plotWidth * (index + 0.5) / DIMENSOES_HISTORICAS_AGROMEL.length;
  const y = (value: number) => baseline - plotHeight * value / 4;
  const linhasRotulo = [
    ['Organizacional e', 'Governança'],
    ['Social e Território'],
    ['Produção e Negócio'],
    ['Gestão Econômico-', 'Financeira'],
    ['Regularidade e', 'Gestão de Riscos'],
  ];
  const coresPrioridade: Record<string, string> = { Crítica: '#b44747', Média: '#c5a542' };
  return <div className="space-y-3">
    {parte === 'grafico' && <figure className="resumo-cartao min-w-0 space-y-3" aria-labelledby="priorizacao-dimensoes-titulo">
      <figcaption><h5 id="priorizacao-dimensoes-titulo">Prioridades de dimensão e ordem de atuação</h5><p className="text-xs text-muted-foreground">Nota consolidada de priorização · escala de 0 a 4. Pontos e hastes refletem os valores históricos da referência; a nota atual permanece sem cálculo validado.</p></figcaption>
      <div><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="block w-full" role="img" aria-label="Gráfico de priorização consolidada por dimensão">
        <title>Nota consolidada de priorização por dimensão</title>
        <desc>Escala vertical de zero a quatro. Cinco notas históricas são mostradas com hastes até a linha de base; não representam o resultado atual validado.</desc>
        {[0,1,2,3,4].map(tick => <g key={tick}><line x1={left} x2={chartWidth-right} y1={y(tick)} y2={y(tick)} stroke={tick===0?'#7b8795':'#e1e6ec'} strokeWidth={tick===0?1.5:1}/><text x={left-14} y={y(tick)+4} textAnchor="end" fontSize="12" fill="#526174">{tick}</text></g>)}
        <text transform={`translate(22 ${(top+baseline)/2}) rotate(-90)`} textAnchor="middle" fontSize="13" fill="#263b55">Nota consolidada de priorização</text>
        {DIMENSOES_HISTORICAS_AGROMEL.map((item,index) => {
          const value = Number(item.consolidada.replace(',', '.'));
          return <g key={item.dimensao}>
            <line x1={x(index)} x2={x(index)} y1={baseline} y2={y(value)} stroke="#aab5c2" strokeWidth="2"/>
            <circle cx={x(index)} cy={y(value)} r="8" fill={coresPrioridade[item.prioridade]} stroke="#fff" strokeWidth="2"/>
            <text x={x(index)} y={y(value)-14} textAnchor="middle" fontSize="13" fontWeight="700" fill={coresPrioridade[item.prioridade]}>{item.consolidada}</text>
            <text x={x(index)} y={baseline+27} textAnchor="middle" fontSize="12" fill="#263b55">{linhasRotulo[index].map((linha,i)=><tspan key={linha} x={x(index)} dy={i===0?0:16}>{linha}</tspan>)}</text>
            <text x={x(index)} y={baseline+67} textAnchor="middle" fontSize="11" fontWeight="600" fill={coresPrioridade[item.prioridade]}>{item.prioridade}</text>
          </g>;
        })}
        <text x={(left+chartWidth-right)/2} y={chartHeight-14} textAnchor="middle" fontSize="12" fill="#526174">Dimensões integradas</text>
      </svg></div>
      <div className="flex flex-wrap gap-4 text-xs"><span className="inline-flex items-center gap-2"><i className="size-3 rounded-full" style={{background:coresPrioridade.Crítica}}/>Prioridade crítica</span><span className="inline-flex items-center gap-2"><i className="size-3 rounded-full" style={{background:coresPrioridade.Média}}/>Prioridade média</span></div>
      <p className="text-xs text-muted-foreground">As cinco notas atuais por dimensão integrada não estão calculáveis enquanto o IEO aguarda reavaliação e o remapeamento dimensional permanece pendente. O gráfico preserva somente os pontos históricos informados; nenhum valor ausente foi convertido em zero.</p>
    </figure>}
    {parte === 'detalhes' && <details className="resumo-expansivel"><summary>Ver prioridades dimensionais</summary><div className="resumo-cartao resumo-tabela-container"><div className="overflow-x-auto"><table className="resumo-tabela resumo-tabela-prioridades min-w-[1450px]">
      <colgroup><col style={{width:85}}/><col style={{width:105}}/><col style={{width:320}}/><col style={{width:140}}/><col style={{width:140}}/><col style={{width:115}}/><col style={{width:165}}/><col style={{width:300}}/></colgroup>
      <caption>Prioridades dimensionais</caption>
      <thead><tr>{['Ordem','Prioridade','Dimensão integrada','Nota IEO','Nota Matriz','Nota Cesta','Consolidada','Fórmula'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{DIMENSOES_HISTORICAS_AGROMEL.map(d => <tr key={d.ordem}>
        <th scope="row" data-label="Ordem">{d.ordem}</th><td data-label="Prioridade">{d.prioridade}</td>
        <td data-label="Dimensão integrada"><strong>{d.dimensao}</strong><p className="mt-1 text-xs text-muted-foreground">{d.descricao}</p></td>
        <td data-label="Nota IEO">{d.ieo}</td><td data-label="Nota Matriz">{d.matriz}</td>
        <td data-label="Nota Cesta">{d.cesta}</td><td data-label="Consolidada">{d.consolidada}</td><td data-label="Fórmula">{d.formula}</td>
      </tr>)}</tbody>
    </table></div></div>{onConsultarIeo && <button type="button" className="resumo-acao" onClick={onConsultarIeo}>Abrir perguntas e vínculos usados</button>}</details>}
  </div>;
}

/** Reúne registros existentes; não converte respostas nem cria prioridades. */
export function ResumoDiagnostico({
  diagnosticoId,
  organizacaoId,
  onConsultarIeo,
  onConsultarParecer,
  readOnly = true,
}: {
  diagnosticoId: string;
  organizacaoId: string;
  onConsultarIeo?: () => void;
  onConsultarParecer?: () => void;
  readOnly?: boolean;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const conclusaoOriginal = useRef<HTMLDivElement>(null);
  const [editandoConclusao, setEditandoConclusao] = useState(false);
  const [textoConclusao, setTextoConclusao] = useState("");
  const [prioridadeAberta, setPrioridadeAberta] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const salvarConclusao = useMutation({
    mutationFn: (texto: string) => salvarConclusaoTecnica({ data: { diagnosticoId, texto } }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["diagnostico-parecer", diagnosticoId] }); setEditandoConclusao(false); },
  });
  const ficha = useFichaOrganizacao(organizacaoId);
  const caderno = useCaderno({ diagnosticoId, organizacaoId });
  const matriz = useQuery({
    queryKey: ["diagnostico-matriz", diagnosticoId, organizacaoId],
    queryFn: () => listarRespostasMatriz({ data: { diagnosticoId, organizacaoId } }),
  });
  const parecer = useQuery({
    queryKey: ["diagnostico-parecer", diagnosticoId],
    queryFn: () => getParecer({ data: { diagnosticoId } }),
  });
  const produtos = useQuery({
    queryKey: ['diagnostico-produtos', diagnosticoId],
    queryFn: () => listarProdutos({ data: { diagnosticoId } }),
  });
  // Inclui áreas fechadas na impressão e restaura a leitura escolhida depois.
  useEffect(() => {
    let fechados: HTMLDetailsElement[] = [];
    let imprimindo = false;
    const antes = () => {
      if (imprimindo) return;
      imprimindo = true;
      fechados = Array.from(
        raiz.current?.querySelectorAll<HTMLDetailsElement>("details:not([open])") ?? [],
      );
      fechados.forEach((d) => {
        d.open = true;
      });
    };
    const depois = () => {
      fechados.forEach((d) => {
        d.open = false;
      });
      fechados = [];
      imprimindo = false;
    };
    window.addEventListener("beforeprint", antes);
    window.addEventListener("afterprint", depois);
    return () => {
      depois();
      window.removeEventListener("beforeprint", antes);
      window.removeEventListener("afterprint", depois);
    };
  }, []);
  const consultas = [ficha, matriz, caderno, parecer, produtos];
  if (consultas.some((c) => c.isLoading)) return <p role="status">Carregando resumo…</p>;
  const org = ficha.data;
  if (consultas.some((c) => c.error) || !org)
    return (
      <p role="alert">
        Não foi possível carregar o resumo.{" "}
        <button
          type="button"
          className="resumo-acao"
          onClick={() => {
            consultas.forEach((c) => {
              void c.refetch();
            });
          }}
        >
          Tentar novamente
        </button>
      </p>
    );
  const registros = caderno.data ?? [];
  const resultado = calcularIeoCaderno(registros);
  const consolidada = calcularNotaConsolidada(registros, produtos.data ?? []);
  const prioridades = prioridadesDoCaderno(registros);
  const pendencias = prioridades.filter((r) =>
    pendenciaDeRemapeamento(r.resposta.valor || r.resposta.relato),
  );
  const diagnosticoAgromel = org.id === AGROMEL_ID_REAVALIACAO_IEO;
  // A referência da AGROMEL informa que as 25 questões aguardam reavaliação pela revisão CRIA de 22/10/2026.
  const ieoPendente = ieoAguardandoReavaliacao(org.id, registros);
  const referenciasPrioridades = diagnosticoAgromel
    ? ["Engajamento dos cooperados", "Capital de giro", "Comercialização Coletiva"].map((titulo, i) => ({
        codigo: `PRIO${i + 1}`,
        resposta: { valor: titulo, relato: "", respondentes: "" },
        referencia: true,
      }))
    : [];
  const estrategicas = prioridades.filter((r) => !pendencias.includes(r));
  const prioridadesExibidas = estrategicas.length
    ? estrategicas.map((r) => ({ ...r, referencia: false }))
    : referenciasPrioridades;
  const emRevisao = ieoPendente || resultado.geral === null || pendencias.length > 0;
  const textoCaderno = (codigo: string) =>
    registros.find((r) => r.contexto === "" && r.codigo === codigo)?.resposta.valor;
  const capacidades = parecer.data?.capacidades || textoCaderno("E02");
  const fragilidades = parecer.data?.fragilidades || textoCaderno("D01");
  const sintese = parecer.data?.sintese;
  const cartoesPrioridade = diagnosticoAgromel
    ? PRIORIDADES_AGROMEL.map(p => ({ codigo: p.codigo, titulo: p.titulo, resumo: p.resultado, campos: { resultado: p.resultado, obstaculo: p.obstaculo, apoio: p.apoio, publico: p.publico, dimensoes: p.dimensoes }, valor: '', relato: '', respondentes: '', etiqueta: 'Referência histórica' }))
    : prioridadesExibidas.map(r => {
        const campos = camposDaPrioridade([r.resposta.valor, r.resposta.relato].filter(Boolean).join('\n'));
        return { codigo: r.codigo, titulo: trechoExecutivo(r.resposta.valor?.split('\n')[0], 120) || `Prioridade ${r.codigo.slice(-1)}`, resumo: campos.resultado || r.resposta.relato || '', campos, valor: r.resposta.valor || '', relato: r.resposta.relato || '', respondentes: r.resposta.respondentes || '', etiqueta: r.referencia ? 'Referência indicada · detalhes não registrados' : emRevisao ? 'Aguardando confirmação' : 'Registro' };
      });
  const prioridadeSelecionada = cartoesPrioridade.find(p => p.codigo === prioridadeAberta);
  const indiceMatriz = new Map((matriz.data ?? []).map((r) => [r.funcaoId, r]));
  const funcoesRegistradas = FUNCOES_MATRIZ.flatMap((funcao) => {
    const resposta = indiceMatriz.get(funcao.id);
    return resposta ? [{ funcao, resposta, leitura: leituraMatriz(resposta.criticidade, resposta.experiencia ?? null) }] : [];
  });
  const observacoes = [
    ...(matriz.data ?? [])
      .filter((r) => r.observacoes?.trim())
      .map((r) => ({
        id: `matriz-${r.funcaoId}`,
        origem: `Matriz Funcional · função ${r.funcaoId}`,
        texto: r.observacoes,
      })),
    ...registros
      .filter((r) => r.resposta.relato.trim())
      .map((r) => ({
        id: `caderno-${r.codigo}-${r.contexto}`,
        origem: `Resposta · ${r.codigo}${r.contexto ? ` · ${r.contexto}` : ""}`,
        texto: r.resposta.relato,
      })),
    ...(org.notas ?? []).map((n) => ({
      id: `nota-${n.id}`,
      origem: "Nota da organização",
      texto: n.conteudo,
    })),
  ];
  return (
    <div ref={raiz} className="diagnostico-resumo">
      <section className="resumo-secao-conclusao-geral" aria-label="Conclusão geral do mapeamento">
        <p className="diagnostico-sobretitulo">Resumo do diagnóstico</p>
        <h4>Conclusão geral</h4>
        <p className="resumo-sintese">{diagnosticoAgromel
          ? 'A AGROMEL possui experiências produtivas e oportunidades de diversificação, mas seu fortalecimento depende, sobretudo, da consolidação da gestão coletiva, do engajamento dos cooperados e da capacidade de sustentar economicamente suas operações atuais e futuras.'
          : sintese?.trim() || 'Não registrado no parecer técnico.'}</p>
      </section>
      <section className="resumo-secao-destaques" aria-label="Destaque principal e principal fragilidade transversal">
        <div className="resumo-duas-colunas">
          <article className="resumo-cartao resumo-potencial">
            <h5><Sprout size={20} aria-hidden="true" /> Destaque Principal</h5>
            <p>{diagnosticoAgromel
              ? 'Experiência com o mel e existência de uma base produtiva de beneficiamento já operante. A cooperativa tem um trabalho histórico e recorrente de articulação institucional, que disponibiliza uma rede de parceiros para atuar em necessidades coletivas.'
              : capacidades?.trim() || 'Não registrado no parecer técnico.'}</p>
          </article>
          <article className="resumo-cartao resumo-fragilidade">
            <h5><AlertTriangle size={20} aria-hidden="true" /> Principal fragilidade transversal</h5>
            <p>{diagnosticoAgromel
              ? 'Dificuldade de converter iniciativas e esforços individuais em processos coletivos regulares, com responsabilidades, acompanhamento e participação.'
              : fragilidades?.trim() || 'Não registrado no parecer técnico.'}</p>
          </article>
        </div>
      </section>
      <section aria-label="Síntese atual da Matriz Funcional">
        <h4>Matriz Funcional</h4>
        <p>{funcoesRegistradas.length} de {FUNCOES_MATRIZ.length} funções com resposta salva. As leituras usam experiência e criticidade; respostas sem esses campos aparecem como incompletas.</p>
        {funcoesRegistradas.length === 0 ? <p>Nenhuma função registrada.</p> : <>
          <p>{['Lacuna crítica', 'Lacuna relevante', 'Melhoria pontual', 'Acompanhar', 'Completar avaliação'].map((leitura) => `${leitura}: ${funcoesRegistradas.filter((item) => item.leitura === leitura).length}`).join(' · ')}</p>
          <details className="resumo-expansivel">
            <summary>Ver funções registradas</summary>
            <div className="w-full min-w-0">
              <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
                <thead><tr><th>Função</th><th>Experiência</th><th>Criticidade</th><th>Leitura orientativa</th></tr></thead>
                <tbody>{funcoesRegistradas.map(({ funcao, resposta, leitura }) => <tr key={funcao.id}>
                  <td className="border p-1 break-words">{funcao.id} · {funcao.nome}</td><td className="border p-1 break-words">{resposta.experiencia || 'Não informada'}</td><td className="border p-1 break-words">{resposta.criticidade || 'Não informada'}</td><td className="border p-1 break-words">{leitura}</td>
                </tr>)}</tbody>
              </table>
            </div>
          </details>
        </>}
        <p>O parecer técnico, as prioridades pactuadas e os resultados históricos são registrados separadamente e não são alterados automaticamente.</p>
      </section>
      <div className="resumo-prioridades-lado-a-lado">
      <section className="resumo-secao-prioridades-dimensionais" aria-label="Prioridades por dimensão">
        <h4>Prioridades de dimensão e ordem de atuação</h4>
        {diagnosticoAgromel ? <PrioridadesDimensionaisHistoricasAgromel parte="grafico" onConsultarIeo={onConsultarIeo} /> : <DimensoesResumo parte="grafico"
          historico={ieoPendente}
          dimensoes={resultado.porDimensao.map((d) => ({ ...d, codigos: DIMENSOES_IEO_CADERNO.find((item) => item.id === d.dimensaoId)?.codigos }))}
          onConsultarIeo={onConsultarIeo}
          rotulo={emRevisao ? "Em revisão" : "Síntese das respostas"}
        />}
        {!diagnosticoAgromel && onConsultarIeo && (
          <button type="button" className="resumo-acao" onClick={onConsultarIeo}>
            Consultar respostas do IEO
          </button>
        )}
      </section>
      <section className="resumo-secao-prioridades-estrategicas" aria-label="Prioridades estratégicas">
        <h4>Prioridades estratégicas identificadas</h4>
        <div className="resumo-cartoes-prioridades">
          {cartoesPrioridade.map(p => <button type="button" key={p.codigo} className="resumo-cartao resumo-prioridade resumo-prioridade-botao" onClick={() => setPrioridadeAberta(p.codigo)}>
            <strong>{p.titulo}</strong>
            <span>{trechoExecutivo(p.resumo, 150) || 'Detalhes não registrados.'}</span>
            <span className="resumo-prioridade-link">Ver detalhes</span>
          </button>)}
        </div>
        {!diagnosticoAgromel && !prioridadesExibidas.length && <p>Não registrado.</p>}
        {parecer.data?.pontosPrioritarios && (
          <details className="resumo-expansivel">
            <summary>Consultar pontos prioritários do parecer</summary>
            <div className="resumo-texto-integral">{parecer.data.pontosPrioritarios}</div>
          </details>
        )}
      </section>
      <div className="resumo-prioridades-detalhes">{diagnosticoAgromel ? <PrioridadesDimensionaisHistoricasAgromel parte="detalhes" onConsultarIeo={onConsultarIeo} /> : <DimensoesResumo parte="detalhes" dimensoes={resultado.porDimensao.map(d => ({ ...d, codigos: DIMENSOES_IEO_CADERNO.find(item => item.id === d.dimensaoId)?.codigos }))} onConsultarIeo={onConsultarIeo} rotulo={emRevisao ? 'Em revisão' : 'Síntese das respostas'} />}</div>
      </div>
      {prioridadeSelecionada && <PopupDetalhe titulo={prioridadeSelecionada.titulo} descricao={`${prioridadeSelecionada.codigo} · ${prioridadeSelecionada.etiqueta}`} aoFechar={() => setPrioridadeAberta(null)}>
        <div className="resumo-prioridade space-y-4">
          <dl>{[['resultado','Resultado desejado'],['obstaculo','Obstáculo'],['apoio','Apoio necessário'],['publico','Público beneficiado'],['dimensoes','Dimensões vinculadas']].map(([chave, label]) => <div key={chave}><dt>{label}</dt><dd>{prioridadeSelecionada.campos[chave as keyof typeof prioridadeSelecionada.campos] || 'Não discriminado no registro.'}</dd></div>)}</dl>
          {!diagnosticoAgromel && <div className="space-y-2"><h5>Registro completo</h5><p className="resumo-texto-integral">{prioridadeSelecionada.valor || 'Não registrado.'}</p><p className="resumo-texto-integral">{prioridadeSelecionada.relato || 'Sem relato adicional.'}</p><p><strong>Respondentes / responsável:</strong> {prioridadeSelecionada.respondentes || 'Não informado'}</p></div>}
          {onConsultarParecer && <button type="button" className="resumo-acao" onClick={onConsultarParecer}>{readOnly ? 'Consultar parecer e prioridades' : 'Consultar ou editar prioridades'}</button>}
        </div>
      </PopupDetalhe>}
      <section className="resumo-secao-conclusao-tecnica" aria-label="Conclusão técnica completa">
        <h4>Conclusão técnica completa</h4>
        {diagnosticoAgromel ? parecer.data?.consideracoesTecnicas != null ? <div className="resumo-cartao resumo-texto-integral">{parecer.data.consideracoesTecnicas}</div> : <div ref={conclusaoOriginal} className="resumo-cartao resumo-conclusao-tecnica">
          <p>O diagnóstico da AGROMEL revela uma <strong>cooperativa com experiência produtiva, atividades econômicas em funcionamento e oportunidades de diversificação</strong>. Entretanto, seu fortalecimento ainda <strong>depende de avanços na organização dos processos de gestão, na participação dos cooperados e na estruturação das operações coletivas</strong>.</p>
          <p>A produção e a comercialização de mel constituem a principal referência de atuação da cooperativa. A existência de um selo de produto artesanal, conforme informado no levantamento, também representa um elemento relevante de sua trajetória. Contudo, os impactos ambientais e a redução do volume produzido têm levado a AGROMEL a buscar alternativas para diversificar suas fontes de receita e reduzir a dependência dessa atividade.</p>
          <p>Foram identificadas oportunidades relacionadas ao beneficiamento do mel, às frutas, à macaxeira e seus derivados, às hortaliças e ao turismo rural. Essas possibilidades apresentam diferentes níveis de maturidade e exigem avaliações específicas antes de serem incorporadas às operações da cooperativa.</p>
          <p><strong>A implantação da agroindústria de frutas foi definida como prioridade</strong>, principalmente diante do desperdício da produção já existente entre os cooperados. A iniciativa está alinhada ao projeto aprovado pelo Inova Sociobio II e é uma oportunidade de agregar valor à produção local. Ainda há definições pendentes sobre o fornecimento de matéria-prima, a distribuição de responsabilidades, a gestão operacional e a comercialização.</p>
          <p>A preparação dessa atividade evidencia uma fragilidade mais ampla: embora existam práticas de gestão e mecanismos de funcionamento, muitos processos ainda não estão suficientemente estruturados para garantir continuidade, acompanhamento e tomada de decisão. Isso aparece especialmente no planejamento da produção, na divisão de tarefas, no acompanhamento das decisões e na organização das informações dos cooperados.</p>
          <p><strong>A ausência de controles produtivos regulares e centralizados constitui um desafio importante</strong>, tanto para a agroindústria quanto para avaliar outras oportunidades de negócio. As demais possibilidades de diversificação devem ser precedidas de estudos específicos de mercado e viabilidade, considerando disponibilidade de matéria-prima, capacidade de fornecimento, custos e demanda potencial.</p>
          <p>Na dimensão social e organizacional, é necessário fortalecer o envolvimento dos cooperados nas decisões e nas atividades coletivas, considerando suas necessidades, capacidades e expectativas. Isso será especialmente importante para a operação da agroindústria, que dependerá da articulação entre produtores e de compromissos compartilhados.</p>
          <p>Na gestão econômico-financeira, a AGROMEL possui práticas e conhecimentos que podem apoiar o aprimoramento dos controles. Ainda são desafios o planejamento dos recursos, a disponibilidade de capital de giro e o uso de informações financeiras para orientar decisões.</p>
          <p>A Matriz Funcional identifica interesse elevado no desenvolvimento de diferentes funções. <strong>Esse interesse não significa que todas as atividades devam ser assumidas diretamente pela cooperativa.</strong> O fortalecimento pode combinar aprimoramento das funções existentes, parcerias e serviços compartilhados, considerando capacidades, necessidades dos cooperados e decisões coletivas.</p>
          <p>O IEO foi atualizado para o Caderno CRIA rev. 22/10/2026. As 25 perguntas aguardam reavaliação pelos novos descritores. Os níveis anteriores devem ser preservados como histórico; o IEO atual está sem nota calculável. Os relatos antigos e as prioridades dimensionais do agrupamento anterior precisam ser conferidos e remapeados antes de serem apresentados como avaliação atual.</p>
          <p>De forma integrada, o principal desafio da AGROMEL não está apenas em ampliar a produção ou acessar mercados, mas em desenvolver a capacidade de organizar, coordenar e sustentar coletivamente suas atividades econômicas. A agroindústria de frutas torna essa necessidade ainda mais evidente.</p>
          <p>Engajamento dos cooperados, capital de giro e comercialização permanecem como temas relevantes do levantamento anterior, mas devem ser confirmados e pactuados considerando as condições atuais da cooperativa e as exigências da nova operação.</p>
          <p>Conclui-se que a AGROMEL possui uma base produtiva e oportunidades concretas de fortalecimento, especialmente por meio da agregação de valor à produção dos cooperados. A consolidação desse potencial dependerá da capacidade de estruturar a gestão, mobilizar os cooperados e assegurar condições operacionais e financeiras para sustentar as iniciativas priorizadas.</p>
        </div> : <details className="resumo-expansivel" open><summary>Ler conclusão completa</summary><div>
          {[["Síntese geral", sintese], ["Potencial e capacidades", capacidades], ["Fragilidades", fragilidades], ["Pontos prioritários", parecer.data?.pontosPrioritarios], ["Considerações técnicas", parecer.data?.consideracoesTecnicas]].map(([titulo, texto]) => <section key={titulo}><h5>{titulo}</h5><p className="resumo-texto-integral">{texto || 'Não registrado.'}</p></section>)}
          {parecer.data?.atualizadoEm && <p>Parecer atualizado em {formatDateOnly(parecer.data.atualizadoEm)}.</p>}
        </div></details>}
        {!readOnly && (editandoConclusao ? <div className="space-y-2">
          <label htmlFor="conclusao-tecnica-edicao">Texto da conclusão técnica</label>
          <textarea id="conclusao-tecnica-edicao" className="w-full rounded-md border p-3" rows={12} value={textoConclusao} onChange={e => setTextoConclusao(e.target.value)} />
          {salvarConclusao.isError && <p role="alert">Não foi possível salvar a conclusão técnica. Tente novamente.</p>}
          <div className="flex gap-2"><button type="button" className="resumo-acao" disabled={salvarConclusao.isPending} onClick={() => salvarConclusao.mutate(textoConclusao)}>Salvar conclusão</button><button type="button" className="resumo-acao" disabled={salvarConclusao.isPending} onClick={() => setEditandoConclusao(false)}>Cancelar</button></div>
        </div> : <button type="button" className="resumo-acao" onClick={() => { setTextoConclusao(parecer.data?.consideracoesTecnicas ?? conclusaoOriginal.current?.innerText ?? ''); setEditandoConclusao(true); }}>Editar conclusão</button>)}
      </section>
    </div>
  );
}
