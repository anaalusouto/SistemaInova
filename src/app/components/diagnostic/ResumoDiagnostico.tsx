import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Sprout } from "lucide-react";
import { getParecer, listarRespostasMatriz, listarRespostasIeo } from "../../diagnosticos.server";
import { useFichaOrganizacao } from "../organizacoes/useOrganizacoes";
import { DocumentosRegistro } from "../DocumentosRegistro";
import { formatDateOnly } from "../../lib/dateOnly";
import { useCaderno } from "./CadernoItens";
import { calcularIeoCaderno } from "../../diagnostic/ieoCaderno";
import { calcularIeo } from "../../diagnostic/ieoCalculation";
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
  media: number | null;
  respondidas: number;
  pontuadas?: number;
  total: number;
};

function DimensoesResumo({
  dimensoes,
  historico,
  rotulo,
}: {
  dimensoes: Dimensao[];
  historico?: boolean;
  rotulo: string;
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
          <caption>Notas consolidadas · {rotulo}</caption>
          <thead>
            <tr>
              <th scope="col">Dimensão</th>
              <th scope="col">Situação da nota</th>
              <th scope="col">Nota / 4</th>
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((d) => (
              <tr key={d.dimensaoId}>
                <th scope="row" data-label="Dimensão">
                  {d.dimensaoTitulo}
                </th>
                <td data-label="Situação da nota">
                  {d.media === null
                    ? "Sem nota calculável"
                    : historico
                      ? "Histórica"
                      : d.respondidas < d.total
                        ? "Parcial"
                        : "Com respostas registradas"}
                </td>
                <td data-label="Nota / 4">
                  <strong>{nota(d.media)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <details className="resumo-expansivel">
          <summary>Consultar composição das notas</summary>
          <div>
            <ul>
              {ordenadas.map((d) => (
                <li key={d.dimensaoId}>
                  <strong>{d.dimensaoTitulo}:</strong> {d.respondidas}/{d.total} perguntas
                  respondidas · {d.pontuadas ?? d.respondidas} com nota.
                </li>
              ))}
            </ul>
            <p>
              A cobertura inclui marcações sem pontuação. Consulte a metodologia para os critérios
              de cálculo.
            </p>
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
  const ieo = useQuery({
    queryKey: ["diagnostico-ieo", diagnosticoId],
    queryFn: () => listarRespostasIeo({ data: { diagnosticoId } }),
  });
  const parecer = useQuery({
    queryKey: ["diagnostico-parecer", diagnosticoId],
    queryFn: () => getParecer({ data: { diagnosticoId } }),
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
  const consultas = [ficha, matriz, ieo, caderno, parecer];
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
  const anterior = calcularIeo(ieo.data ?? []);
  const prioridades = prioridadesDoCaderno(registros);
  const pendencias = prioridades.filter((r) =>
    pendenciaDeRemapeamento(r.resposta.valor || r.resposta.relato),
  );
  const estrategicas = prioridades.filter((r) => !pendencias.includes(r));
  const emRevisao = resultado.geral === null || pendencias.length > 0;
  const textoCaderno = (codigo: string) =>
    registros.find((r) => r.contexto === "" && r.codigo === codigo)?.resposta.valor;
  const capacidades = parecer.data?.capacidades || textoCaderno("E02");
  const fragilidades = parecer.data?.fragilidades || textoCaderno("D01");
  const sintese = parecer.data?.sintese;
  const historicoRotulo = pendencias.length
    ? "Histórico — remapeamento pendente"
    : "Histórico — instrumento anterior";
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
        origem: `Caderno CRIA · ${r.codigo}${r.contexto ? ` · ${r.contexto}` : ""}`,
        texto: r.resposta.relato,
      })),
    ...(ieo.data ?? [])
      .filter((r) => r.observacao?.trim())
      .map((r) => ({
        id: `ieo-${r.perguntaId}`,
        origem: `Histórico IEO · pergunta ${r.perguntaId}`,
        texto: r.observacao,
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
        <p>Caderno CRIA · revisão do instrumento em 22/10/2026</p>
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
          {resultado.geral === null ? (
            "O IEO atual está sem nota calculável: não há respostas pontuáveis no caderno atual. Resultados do instrumento anterior são apresentados apenas como histórico."
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
            resposta no caderno atual.
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
        <h4>Síntese executiva</h4>
        <p className="resumo-sintese">
          {trechoExecutivo(sintese) ||
            "A síntese geral ainda não foi registrada no parecer técnico."}
        </p>
        <div className="resumo-duas-colunas">
          <article className="resumo-cartao resumo-potencial">
            <h5>
              <Sprout size={20} aria-hidden="true" /> Potencial e capacidades
            </h5>
            <p>
              {trechoExecutivo(capacidades) ||
                "Nenhuma capacidade registrada no parecer ou no fechamento estratégico."}
            </p>
            <p className="resumo-fonte">
              Fonte:{" "}
              {parecer.data?.capacidades ? "parecer técnico" : "fechamento estratégico · E02"}
            </p>
          </article>
          <article className="resumo-cartao resumo-fragilidade">
            <h5>
              <AlertTriangle size={20} aria-hidden="true" /> Fragilidade principal
            </h5>
            <p>
              {trechoExecutivo(fragilidades) ||
                "Nenhuma fragilidade registrada no parecer ou no relato da diretoria."}
            </p>
            <p className="resumo-fonte">
              Fonte: {parecer.data?.fragilidades ? "parecer técnico" : "relato da diretoria · D01"}
            </p>
          </article>
        </div>
      </section>
      <section aria-label="Prioridades estratégicas">
        <h4>Prioridades estratégicas identificadas</h4>
        <p>
          {emRevisao
            ? "Aguardam confirmação após a revisão do diagnóstico."
            : "Prioridades registradas no fechamento estratégico do caderno."}
        </p>
        <div className="resumo-duas-colunas">
          {estrategicas.map((r) => {
            const campos = camposDaPrioridade(
              [r.resposta.valor, r.resposta.relato].filter(Boolean).join("\n"),
            );
            const titulo =
              trechoExecutivo(r.resposta.valor?.split("\n")[0], 120) ||
              `Prioridade ${r.codigo.slice(-1)}`;
            return (
              <article key={r.codigo} className="resumo-cartao resumo-prioridade">
                <p className="resumo-etiqueta">
                  {r.codigo} · {emRevisao ? "Aguardando confirmação" : "Registro do caderno"}
                </p>
                <h5>{titulo}</h5>
                <dl>
                  {[
                    ["resultado", "Resultado desejado"],
                    ["obstaculo", "Obstáculo"],
                    ["apoio", "Apoio necessário"],
                    ["publico", "Público beneficiado"],
                  ].map(([chave, label]) => (
                    <div key={chave}>
                      <dt>{label}</dt>
                      <dd>{campos[chave] || "Não discriminado no registro."}</dd>
                    </div>
                  ))}
                </dl>
                <details className="resumo-expansivel">
                  <summary>Consultar registro completo</summary>
                  <div>
                    <p className="resumo-texto-integral">{r.resposta.valor}</p>
                    <p className="resumo-texto-integral">{r.resposta.relato}</p>
                    <p>
                      <strong>Fonte:</strong> {r.resposta.fonte || "Não informada"}
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
        {!estrategicas.length && <p>Nenhuma prioridade estratégica registrada em PRIO1–PRIO3.</p>}
        {parecer.data?.pontosPrioritarios && (
          <details className="resumo-expansivel">
            <summary>Consultar pontos prioritários do parecer</summary>
            <div className="resumo-texto-integral">{parecer.data.pontosPrioritarios}</div>
          </details>
        )}
      </section>
      <section aria-label="Prioridades por dimensão">
        <h4>Prioridades por dimensão</h4>
        <DimensoesResumo
          dimensoes={resultado.porDimensao}
          rotulo={
            emRevisao ? "Caderno atual — em revisão" : "Caderno atual — síntese das respostas"
          }
        />
        {onConsultarIeo && (
          <button type="button" className="resumo-acao" onClick={onConsultarIeo}>
            Consultar respostas do IEO
          </button>
        )}
        {(ieo.data?.length ?? 0) > 0 && (
          <details className="resumo-expansivel resumo-historico">
            <summary>Consultar IEO histórico · instrumento anterior</summary>
            <div>
              <p>
                Respostas anteriores preservadas para consulta. Elas não foram convertidas para o
                caderno CRIA e não integram o IEO atual.
              </p>
              <DimensoesResumo
                dimensoes={anterior.porDimensao}
                historico
                rotulo={historicoRotulo}
              />
            </div>
          </details>
        )}
      </section>
      <section aria-label="Conclusão técnica completa">
        <h4>Conclusão técnica completa</h4>
        <details className="resumo-expansivel">
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
              Respostas do instrumento anterior não são convertidas.
            </p>
          </div>
        </details>
        <div className="resumo-cartao">
          <h5>Pendências de atualização</h5>
          {pendencias.length ? (
            pendencias.map((r) => (
              <div key={r.codigo}>
                <p>
                  <strong>Remapeamento dimensional pendente</strong> · referência do caderno:{" "}
                  {r.codigo}
                </p>
                <p className="resumo-texto-integral">{r.resposta.valor}</p>
                <p className="resumo-texto-integral">{r.resposta.relato}</p>
              </div>
            ))
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
