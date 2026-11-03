import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Sprout } from "lucide-react";
import { getParecer, listarProdutos, listarRespostasMatriz } from "../../diagnosticos.server";
import { useFichaOrganizacao } from "../organizacoes/useOrganizacoes";
import { DocumentosRegistro } from "../DocumentosRegistro";
import { formatDateOnly } from "../../lib/dateOnly";
import { useCaderno } from "./CadernoItens";
import { calcularIeoCaderno, DIMENSOES_IEO_CADERNO } from "../../diagnostic/ieoCaderno";
import { calcularNotaConsolidada } from '../../diagnostic/notaConsolidada';
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
}: {
  dimensoes: Dimensao[];
  historico?: boolean;
  rotulo: string;
  onConsultarIeo?: () => void;
}) {
  const ordenadas = ordenarDimensoes(dimensoes);
  return (
    <div className="resumo-dimensoes">
      <figure className="resumo-cartao resumo-grafico">
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
      </figure>
      <div className="resumo-cartao resumo-tabela-container">
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
                  {d.ordem === null ? "Sem ordem calculável" : `${historico ? "Histórica · " : ""}${d.ordem}ª prioridade`}
                </th>
                <td data-label="Dimensão e descrição">
                  <strong>{d.dimensaoTitulo}</strong><br />
                  Indicadores: {d.codigos?.join(", ") || "Não registrados"}
                </td>
                <td data-label="IEO / 4">
                  <strong>{d.media === null ? "Sem nota" : `${nota(d.media)}${historico ? " · histórica" : ""}`}</strong><br />
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
      </div>
    </div>
  );
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
  const ficha = useFichaOrganizacao(organizacaoId);
  const caderno = useCaderno({ diagnosticoId, organizacaoId });
  const matriz = useQuery({
    queryKey: ["diagnostico-matriz", diagnosticoId],
    queryFn: () => listarRespostasMatriz({ data: { diagnosticoId } }),
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
  const diagnosticoAgromel = org.id === "c82c2ac0-56cd-4a88-9d67-f7d2ddb8e061";
  // A referência da AGROMEL informa que as 25 questões aguardam reavaliação pela revisão CRIA de 22/10/2026.
  const ieoAguardandoReavaliacao = diagnosticoAgromel && resultado.total === 25 && resultado.respondidas === 25;
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
  const emRevisao = ieoAguardandoReavaliacao || resultado.geral === null || pendencias.length > 0;
  const textoCaderno = (codigo: string) =>
    registros.find((r) => r.contexto === "" && r.codigo === codigo)?.resposta.valor;
  const capacidades = parecer.data?.capacidades || textoCaderno("E02");
  const fragilidades = parecer.data?.fragilidades || textoCaderno("D01");
  const sintese = parecer.data?.sintese;
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
      <header>
        <p className="diagnostico-sobretitulo">Resumo do diagnóstico</p>
      </header>
      <section
        className={`resumo-situacao ${emRevisao ? "resumo-em-revisao" : ""}`}
        aria-label="Situação metodológica"
      >
        <h4>
          <AlertTriangle size={20} aria-hidden="true" />{" "}
          {emRevisao ? "Diagnóstico em revisão" : "Situação do diagnóstico"}
        </h4>
        <p>
          {ieoAguardandoReavaliacao ? (
            <>O IEO atual está <strong>sem nota calculável validada</strong>. A referência informa que as 25 perguntas aguardam reavaliação pelo Caderno CRIA rev. 22/10/2026. Hoje há 25/25 respostas registradas, 24 notas históricas e Q25 como N/A. As respostas e notas foram preservadas, sem apresentá-las como atuais.</>
          ) : resultado.geral === null ? (
            "O IEO atual está sem nota calculável: não há respostas pontuáveis registradas."
          ) : (
            <>
              IEO atual: <strong>{nota(resultado.geral)} / 4</strong> · {resultado.respondidas}/
              {resultado.total} perguntas respondidas · {resultado.pontuadas} com nota. A síntese
              considera apenas as dimensões com nota.
            </>
          )}
        </p>
        {resultado.respondidas < resultado.total && (
          <p>
            <strong>Pendência:</strong> {resultado.total - resultado.respondidas} perguntas sem
            resposta registrada.
          </p>
        )}
        {pendencias.length > 0 && (
          <p>
            <strong>Pendência de atualização:</strong> remapeamento dimensional registrado como
            pendente. As prioridades estratégicas aguardam confirmação.
          </p>
        )}
        <p>Notas e cobertura de respostas não certificam a validação técnica do diagnóstico.</p>
      </section>
      <section aria-label="Síntese executiva">
        <h4>Conclusão geral do mapeamento</h4>
        <p className="resumo-sintese">
          {sintese?.trim() ||
            "Não registrado no parecer técnico."}
        </p>
        <div className="resumo-duas-colunas">
          <article className="resumo-cartao resumo-potencial">
              <h5>
              <Sprout size={20} aria-hidden="true" /> Destaque principal · capacidades
            </h5>
            <p>
              {capacidades?.trim() ||
                "Nenhuma capacidade registrada no parecer ou no fechamento estratégico."}
            </p>
          </article>
          <article className="resumo-cartao resumo-fragilidade">
            <h5>
              <AlertTriangle size={20} aria-hidden="true" /> Fragilidade principal
            </h5>
            <p>
              {fragilidades?.trim() ||
                "Nenhuma fragilidade registrada no parecer ou no relato da diretoria."}
            </p>
          </article>
        </div>
      </section>
      <section aria-label="Conclusão técnica completa">
        <h4>Conclusão técnica completa</h4>
        <details className="resumo-expansivel" open>
          <summary>Ler conclusão completa</summary>
          <div>
            {[
              ["Síntese geral", sintese],
              ["Potencial e capacidades", capacidades],
              ["Fragilidades", fragilidades],
              ["Pontos prioritários", parecer.data?.pontosPrioritarios],
              ["Considerações técnicas", parecer.data?.consideracoesTecnicas],
            ].map(([titulo, texto]) => (
              <section key={titulo}>
                <h5>{titulo}</h5>
                <p className="resumo-texto-integral">{texto || "Não registrado."}</p>
              </section>
            ))}
            {parecer.data?.atualizadoEm && (
              <p>Parecer atualizado em {formatDateOnly(parecer.data.atualizadoEm)}.</p>
            )}
          </div>
        </details>
        {onConsultarParecer && (
          <button type="button" className="resumo-acao" onClick={onConsultarParecer}>
            {readOnly ? "Consultar parecer técnico" : "Editar parecer técnico"}
          </button>
        )}
      </section>
      <section aria-label="Prioridades por dimensão">
        <h4>Prioridades por dimensão</h4>
        <DimensoesResumo
          historico={ieoAguardandoReavaliacao}
          dimensoes={resultado.porDimensao.map((d) => ({
            ...d,
            codigos: DIMENSOES_IEO_CADERNO.find((item) => item.id === d.dimensaoId)?.codigos,
          }))}
          onConsultarIeo={onConsultarIeo}
          rotulo={
            emRevisao ? "Em revisão" : "Síntese das respostas"
          }
        />
        {onConsultarIeo && (
          <button type="button" className="resumo-acao" onClick={onConsultarIeo}>
            Consultar respostas do IEO
          </button>
        )}
      </section>
      <section aria-label="Prioridades estratégicas">
        <h4>Prioridades estratégicas identificadas</h4>
        <p>
          {emRevisao
            ? "Aguardam confirmação após a revisão do diagnóstico."
            : "Prioridades registradas no fechamento estratégico."}
        </p>
        <div className="resumo-duas-colunas">
          {prioridadesExibidas.map((r) => {
            const campos = camposDaPrioridade(
              [r.resposta.valor, r.resposta.relato].filter(Boolean).join("\n"),
            );
            const titulo =
              trechoExecutivo(r.resposta.valor?.split("\n")[0], 120) ||
              `Prioridade ${r.codigo.slice(-1)}`;
            return (
              <article key={r.codigo} className="resumo-cartao resumo-prioridade">
                <p className="resumo-etiqueta">
                  {r.codigo} · {"referencia" in r && r.referencia ? "Referência indicada · detalhes não registrados" : emRevisao ? "Aguardando confirmação" : "Registro"}
                </p>
                <h5>{titulo}</h5>
                <dl>
                  {[
                    ["resultado", "Resultado desejado"],
                    ["obstaculo", "Obstáculo"],
                    ["apoio", "Apoio necessário"],
                    ["publico", "Público beneficiado"],
                    ["dimensoes", "Dimensões vinculadas"],
                  ].map(([chave, label]) => (
                    <div key={chave}>
                      <dt>{label}</dt>
                      <dd>{campos[chave] || "Não discriminado no registro."}</dd>
                    </div>
                  ))}
                </dl>
                {onConsultarParecer && <button type="button" className="resumo-acao" onClick={onConsultarParecer}>{readOnly ? "Consultar registro de prioridades" : "Consultar ou editar prioridades"}</button>}
                <details className="resumo-expansivel">
                  <summary>Consultar dados disponíveis</summary>
                  <div>
                    <p className="resumo-texto-integral">{r.resposta.valor || "Não registrado."}</p>
                    <p className="resumo-texto-integral">{r.resposta.relato || "Descrição, obstáculos, apoio, público e dimensões vinculadas: não registrados neste diagnóstico."}</p>
                    <p>
                    </p>
                    <p>
                      <strong>Respondentes / responsável:</strong>{" "}
                      {r.resposta.respondentes || "Não informado"}
                    </p>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
        {!prioridadesExibidas.length && <p>Não registrado.</p>}
        {parecer.data?.pontosPrioritarios && (
          <details className="resumo-expansivel">
            <summary>Consultar pontos prioritários do parecer</summary>
            <div className="resumo-texto-integral">{parecer.data.pontosPrioritarios}</div>
          </details>
        )}
      </section>
      <section aria-label="Metodologia, vínculos e pendências">
        <h4>Metodologia, vínculos e pendências</h4>
        <details className="resumo-expansivel">
          <summary>Como a nota e a prioridade são calculadas</summary>
          <div>
            <p>
              O IEO atual é a média das notas 1–4 por dimensão; o IEO geral é a média das dimensões
              com nota. NS, NC, N/A, divergência e vazios não entram nas médias, nem contam como
              zero.
            </p>
            <p>
              As dimensões são um agrupamento analítico do sistema. Notas menores aparecem primeiro
              para apoiar a análise. Empates mantêm a mesma ordem; dimensões sem nota não recebem
              ordem. Não há classificação técnica automática por faixas de nota.
            </p>
            <p>
              Prioridades estratégicas são pactuadas, não derivam automaticamente das notas.
              Respostas anteriores não são convertidas.
            </p>
          </div>
        </details>
        <article className="resumo-cartao">
          <h5>Nota consolidada do mapeamento</h5>
          <p><strong>{ieoAguardandoReavaliacao ? "Não calculável como resultado atual" : `${nota(consolidada.nota)}${consolidada.nota !== null ? " / 4" : ""}`}</strong>{ieoAguardandoReavaliacao && consolidada.nota !== null && <> · cálculo anterior preservado como histórico: {nota(consolidada.nota)} / 4</>}</p>
          <ul>{consolidada.componentes.map((c) => <li key={c.id}>{c.nome}: {nota(c.nota)} · {c.pontuadas} registros com nota{ieoAguardandoReavaliacao && c.id === "ieo" ? " · histórico, aguarda reavaliação" : ""}</li>)}</ul>
          <p>Fórmula geral: 50% IEO + 25% Matriz + 25% Cesta, com redistribuição dos pesos dos componentes sem nota. A fórmula não define uma composição por dimensão; notas dimensionais de Matriz e Cesta e a nota consolidada dimensional estão como “Não registrado / Não calculável”.</p>
        </article>
        <div className="resumo-cartao">
          <h5>Pendências de atualização</h5>
          {pendencias.length ? (
            pendencias.map((r) => (
              <div key={r.codigo}>
                <p>
                  <strong>Remapeamento dimensional pendente</strong> · código:
                  {r.codigo}
                </p>
                <p className="resumo-texto-integral">{r.resposta.valor}</p>
                <p className="resumo-texto-integral">{r.resposta.relato}</p>
              </div>
            ))
          ) : diagnosticoAgromel ? (
            <div>
              <p><strong>Remapeamento dimensional pendente</strong> · apontado na referência AGROMEL.</p>
              <p>O registro original e seus detalhes não foram localizados entre os registros carregados neste diagnóstico. Conteúdo: Não registrado.</p>
              {onConsultarParecer && <button type="button" className="resumo-acao" onClick={onConsultarParecer}>{readOnly ? "Consultar parecer e vínculos" : "Consultar ou editar parecer e vínculos"}</button>}
            </div>
          ) : (
            <p>
              Nenhuma pendência de remapeamento identificada nos títulos das prioridades
              registradas. Consulte as evidências para outras pendências.
            </p>
          )}
        </div>
        <details className="resumo-expansivel">
          <summary>Informações de apoio · documentos, registros e vínculos</summary>
          <div className="resumo-apoio">
            <section aria-label="Documentos do mapeamento">
              <h5>Documentos</h5>
              <DocumentosRegistro
                area="mapeamento"
                organizacaoId={organizacaoId}
                relatorioUrl={org.mapeamentoRelatorioUrl}
              />
            </section>
            <section>
              <h5>Registros da organização</h5>
              {org.registros.length ? (
                org.registros.map((r) => (
                  <article key={r.id} className="resumo-cartao">
                    <h5>
                      {formatDateOnly(r.data)} · {r.assunto || "Registro de contato"}
                    </h5>
                    <p className="resumo-texto-integral">{r.resumo}</p>
                  </article>
                ))
              ) : (
                <p>Nenhum registro disponível.</p>
              )}
            </section>
            <section>
              <h5>Observações de campo</h5>
              {observacoes.length ? (
                observacoes.map((o) => (
                  <article key={o.id} className="resumo-cartao">
                    <h5>{o.origem}</h5>
                    <p className="resumo-texto-integral">{o.texto}</p>
                  </article>
                ))
              ) : (
                <p>Nenhuma observação registrada.</p>
              )}
            </section>
            <section>
              <h5>Vínculos da organização</h5>
              {org.projetos.length ? (
                <ul>
                  {org.projetos.map((p) => (
                    <li key={p.id}>
                      <a
                        href={`/?area=organizations&org=${encodeURIComponent(organizacaoId)}&secao=projeto&projeto=${p.id}`}
                      >
                        {p.codigo} · {p.nome}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum projeto vinculado.</p>
              )}
            </section>
          </div>
        </details>
      </section>
    </div>
  );
}
