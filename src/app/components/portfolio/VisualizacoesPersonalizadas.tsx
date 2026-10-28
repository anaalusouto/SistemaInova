import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, Settings2, Trash2, RotateCcw } from "lucide-react";
import type { ProjectExt } from "../../store";
import {
  agruparVisualizacao,
  chavePreferencias,
  DIMENSOES,
  formatarMetrica,
  lerPreferencias,
  MAX_GRAFICOS,
  METRICAS,
  pontosDispersao,
  preferenciasPadrao,
  TIPOS_GRAFICO,
  usaMedia,
  type ConfigGrafico,
  type PreferenciasVisualizacao,
} from "../../lib/visualizacoesPortfolio";

const CORES = [
  "#426b9b",
  "#538566",
  "#cb8c38",
  "#b75959",
  "#816ba5",
  "#35969c",
  "#a5744a",
  "#6c7e93",
];
const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
};
const controle =
  "min-h-10 w-full min-w-0 rounded-lg border bg-card px-2 py-2 text-xs text-foreground";
const botao =
  "inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50";

export function VisualizacoesPersonalizadas({
  projects,
  login,
  onOpenProject,
}: {
  projects: ProjectExt[];
  login?: string;
  onOpenProject?: (id: number) => void;
}) {
  const [preferencias, setPreferencias] = useState<PreferenciasVisualizacao>(preferenciasPadrao);
  const [editando, setEditando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  useEffect(() => {
    try {
      setPreferencias(
        lerPreferencias(login ? window.localStorage.getItem(chavePreferencias(login)) : null),
      );
    } catch {
      setMensagem("O navegador não permite salvar preferências. As escolhas valem nesta sessão.");
    }
    setPronto(true);
  }, [login]);
  const salvar = (proximas: PreferenciasVisualizacao) => {
    setPreferencias(proximas);
    if (!login) {
      setMensagem("As escolhas valem nesta sessão.");
      return;
    }
    try {
      window.localStorage.setItem(chavePreferencias(login), JSON.stringify(proximas));
      setMensagem("Suas visualizações foram salvas neste navegador.");
    } catch {
      setMensagem(
        "Não foi possível salvar no navegador. As escolhas continuam válidas nesta sessão.",
      );
    }
  };
  return (
    <section aria-labelledby="minhas-visualizacoes" className="space-y-4 min-w-0">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="minhas-visualizacoes" className="text-lg font-semibold">
              Minhas visualizações
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
              Em teste
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Escolha gráficos, indicadores e cruzamentos. Todos usam os filtros acima. Preferências
            por usuário neste navegador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!pronto}
            className={botao}
            aria-pressed={editando}
            onClick={() => setEditando((v) => !v)}
          >
            <Settings2 size={14} />
            {editando ? "Concluir personalização" : "Personalizar visualizações"}
          </button>
          {editando && (
            <button type="button" className={botao} onClick={() => salvar(preferenciasPadrao())}>
              <RotateCcw size={13} />
              Restaurar padrão
            </button>
          )}
        </div>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {mensagem}
      </p>
      {preferencias.graficos.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Seu painel está vazio. Adicione um gráfico para começar.
        </p>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {preferencias.graficos.map((c, i) => (
          <GraficoPersonalizado
            key={c.id}
            config={c}
            numero={i + 1}
            projects={projects}
            editando={editando}
            onOpenProject={onOpenProject}
            onChange={(config) =>
              salvar({
                versao: 1,
                graficos: preferencias.graficos.map((g) => (g.id === c.id ? config : g)),
              })
            }
            onRemove={() =>
              salvar({ versao: 1, graficos: preferencias.graficos.filter((g) => g.id !== c.id) })
            }
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={botao}
          disabled={!pronto || preferencias.graficos.length >= MAX_GRAFICOS}
          onClick={() => {
            const novo = { ...preferenciasPadrao().graficos[0], id: window.crypto.randomUUID() };
            salvar({ versao: 1, graficos: [...preferencias.graficos, novo] });
            setEditando(true);
          }}
        >
          <Plus size={14} />
          Adicionar gráfico
        </button>
        <span className="text-xs text-muted-foreground">
          {preferencias.graficos.length} de {MAX_GRAFICOS} visualizações
        </span>
      </div>
    </section>
  );
}

function GraficoPersonalizado({
  config: c,
  numero,
  projects,
  editando,
  onChange,
  onRemove,
  onOpenProject,
}: {
  config: ConfigGrafico;
  numero: number;
  projects: ProjectExt[];
  editando: boolean;
  onChange: (c: ConfigGrafico) => void;
  onRemove: () => void;
  onOpenProject?: (id: number) => void;
}) {
  const dados = useMemo(() => agruparVisualizacao(projects, c), [projects, c]);
  const pontos = useMemo(() => pontosDispersao(projects, c), [projects, c]);
  const dispersao = c.tipo === "dispersao";
  const metrica = METRICAS.find((m) => m.id === c.metrica)!;
  const metricaX = METRICAS.find((m) => m.id === c.metricaX)!;
  const dimensao = DIMENSOES.find((d) => d.id === c.dimensao)!;
  const media = usaMedia(c);
  const titulo = dispersao
    ? `${metricaX.nome} × ${metrica.nome}`
    : `${metrica.nome} por ${dimensao.nome.toLocaleLowerCase("pt-BR")}`;
  const ausentes = dispersao ? projects.length - pontos.length : dados.ausentes;
  const disponiveis = dispersao
    ? pontos.length > 0
    : dados.linhas.some((l) => dados.series.some((s) => typeof l[s.chave] === "number"));
  const negativos = dados.linhas.some((l) =>
    dados.series.some((s) => typeof l[s.chave] === "number" && (l[s.chave] as number) < 0),
  );
  const pizzaValida = !negativos && dados.linhas.some((l) => Number(l.serie0) > 0);
  const eixos = [
    <CartesianGrid key="grade" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />,
    <XAxis
      key="x"
      dataKey="name"
      tick={{ fontSize: 10 }}
      interval={0}
      angle={-22}
      textAnchor="end"
      height={75}
    />,
    <YAxis
      key="y"
      width={85}
      tick={{ fontSize: 10 }}
      tickFormatter={(v) => formatarMetrica(v, c.metrica)}
    />,
    <Tooltip
      key="tooltip"
      formatter={(v: number) => formatarMetrica(v, c.metrica)}
      contentStyle={tooltipStyle}
    />,
    <Legend key="legenda" wrapperStyle={{ fontSize: 11 }} />,
  ];
  const semDados = (texto: string) => (
    <p
      className="flex items-center justify-center min-h-72 p-6 text-center text-sm text-muted-foreground"
      role="status"
    >
      {texto}
    </p>
  );
  return (
    <article
      className="rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-4"
      aria-label={`Visualização ${numero}: ${titulo}`}
    >
      <div className="flex justify-between items-start gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Visualização {numero}
          </p>
          <h3 className="text-sm font-semibold mt-1">{titulo}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {dispersao
              ? "Cada ponto representa um projeto."
              : `${media ? "Média por projeto com valor informado" : "Soma dos valores informados"}${c.cruzamento !== "nenhum" && c.tipo !== "rosca" && c.cruzamento !== c.dimensao ? ` · separado por ${DIMENSOES.find((d) => d.id === c.cruzamento)!.nome.toLowerCase()}` : ""}`}
          </p>
        </div>
        {editando && (
          <button
            type="button"
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
            aria-label={`Remover visualização ${numero}`}
            onClick={onRemove}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
      {editando && (
        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
          <legend className="sr-only">Personalizar visualização {numero}</legend>
          <label className="text-xs space-y-1">
            <span>Tipo de gráfico</span>
            <select
              className={controle}
              value={c.tipo}
              onChange={(e) => onChange({ ...c, tipo: e.target.value as ConfigGrafico["tipo"] })}
            >
              {TIPOS_GRAFICO.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
          {dispersao ? (
            <label className="text-xs space-y-1">
              <span>Eixo X</span>
              <select
                className={controle}
                value={c.metricaX}
                onChange={(e) =>
                  onChange({ ...c, metricaX: e.target.value as ConfigGrafico["metricaX"] })
                }
              >
                {METRICAS.filter((m) => m.id !== "projetos").map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="text-xs space-y-1">
              <span>Agrupar por</span>
              <select
                className={controle}
                value={c.dimensao}
                onChange={(e) =>
                  onChange({
                    ...c,
                    dimensao: e.target.value as ConfigGrafico["dimensao"],
                    cruzamento: e.target.value === c.cruzamento ? "nenhum" : c.cruzamento,
                  })
                }
              >
                {DIMENSOES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs space-y-1">
            <span>{dispersao ? "Eixo Y" : "O que mostrar"}</span>
            <select
              className={controle}
              value={c.metrica}
              onChange={(e) =>
                onChange({ ...c, metrica: e.target.value as ConfigGrafico["metrica"] })
              }
            >
              {METRICAS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>
          {!dispersao && c.tipo !== "rosca" && (
            <label className="text-xs space-y-1">
              <span>Cruzar com</span>
              <select
                className={controle}
                value={c.cruzamento}
                onChange={(e) =>
                  onChange({ ...c, cruzamento: e.target.value as ConfigGrafico["cruzamento"] })
                }
              >
                <option value="nenhum">Sem cruzamento</option>
                {DIMENSOES.filter((d) => d.id !== c.dimensao).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!dispersao && (
            <label className="text-xs space-y-1">
              <span>Cálculo</span>
              <select
                className={controle}
                value={metrica.unidade === "percentual" ? "media" : c.agregacao}
                disabled={metrica.unidade === "percentual"}
                onChange={(e) =>
                  onChange({ ...c, agregacao: e.target.value as ConfigGrafico["agregacao"] })
                }
              >
                <option value="soma">Total (soma)</option>
                <option value="media">Média por projeto</option>
              </select>
            </label>
          )}
        </fieldset>
      )}
      {!disponiveis ? (
        semDados("Sem valores disponíveis para esta combinação e os filtros atuais.")
      ) : c.tipo === "rosca" && !pizzaValida ? (
        semDados(
          "A rosca precisa de valores positivos e não aceita negativos. Escolha barras para este recorte.",
        )
      ) : (
        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label={`Gráfico ${titulo}`}
        >
          <div
            style={{
              width: "100%",
              minWidth:
                dispersao || c.tipo === "rosca" ? 280 : Math.max(360, dados.linhas.length * 75),
              height: 320,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              {dispersao ? (
                <ScatterChart margin={{ top: 12, right: 24, bottom: 25, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={metricaX.nome}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => formatarMetrica(v, c.metricaX)}
                    label={{ value: metricaX.nome, position: "bottom", fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={metrica.nome}
                    tick={{ fontSize: 10 }}
                    width={85}
                    tickFormatter={(v) => formatarMetrica(v, c.metrica)}
                  />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-lg border bg-card p-3 text-xs">
                          <p className="font-semibold">{payload[0].payload.name}</p>
                          <p>
                            {metricaX.nome}: {formatarMetrica(payload[0].payload.x, c.metricaX)}
                          </p>
                          <p>
                            {metrica.nome}: {formatarMetrica(payload[0].payload.y, c.metrica)}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Scatter name="Projetos" data={pontos} fill={CORES[0]} />
                </ScatterChart>
              ) : c.tipo === "rosca" ? (
                <PieChart>
                  <Pie
                    data={dados.linhas}
                    nameKey="name"
                    dataKey="serie0"
                    innerRadius={55}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {dados.linhas.map((l, i) => (
                      <Cell key={l.name} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatarMetrica(v, c.metrica)}
                    contentStyle={tooltipStyle}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              ) : c.tipo === "linhas" ? (
                <LineChart data={dados.linhas} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                  {eixos}
                  {dados.series.map((s, i) => (
                    <Line
                      key={s.chave}
                      dataKey={s.chave}
                      name={s.nome}
                      stroke={CORES[i % CORES.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              ) : c.tipo === "area" ? (
                <AreaChart data={dados.linhas} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                  {eixos}
                  {dados.series.map((s, i) => (
                    <Area
                      key={s.chave}
                      dataKey={s.chave}
                      name={s.nome}
                      stroke={CORES[i % CORES.length]}
                      fill={CORES[i % CORES.length]}
                      fillOpacity={0.14}
                      connectNulls={false}
                    />
                  ))}
                </AreaChart>
              ) : (
                <BarChart data={dados.linhas} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                  {eixos}
                  {dados.series.map((s, i) => (
                    <Bar
                      key={s.chave}
                      dataKey={s.chave}
                      name={s.nome}
                      fill={CORES[i % CORES.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {ausentes > 0 && (
        <p className="text-xs text-muted-foreground">
          {ausentes} projeto(s) sem valor válido para este cruzamento. Não entram no cálculo;
          valores ausentes não contam como zero.
        </p>
      )}
      {(c.tipo === "linhas" || c.tipo === "area") && (
        <p className="text-xs text-muted-foreground">
          O eixo horizontal compara categorias; não representa uma evolução no tempo.
        </p>
      )}
      <details className="text-xs">
        <summary className="cursor-pointer text-primary font-medium">Ver dados do gráfico</summary>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left">
            <caption className="sr-only">Dados de {titulo}</caption>
            <thead>
              <tr className="border-b">
                {(dispersao
                  ? ["Projeto", metricaX.nome, metrica.nome]
                  : [dimensao.nome, ...dados.series.map((s) => s.nome)]
                ).map((n, i) => (
                  <th key={i} scope="col" className="p-2 font-medium">
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dispersao
                ? pontos.map((p) => (
                    <tr key={p.id} className="border-b">
                      <th scope="row" className="p-2 font-normal">
                        {onOpenProject ? (
                          <button
                            type="button"
                            className="text-primary underline"
                            onClick={() => onOpenProject(p.id)}
                          >
                            {p.name}
                          </button>
                        ) : (
                          p.name
                        )}
                      </th>
                      <td className="p-2">{formatarMetrica(p.x, c.metricaX)}</td>
                      <td className="p-2">{formatarMetrica(p.y, c.metrica)}</td>
                    </tr>
                  ))
                : dados.linhas.map((l) => (
                    <tr key={l.name} className="border-b">
                      <th scope="row" className="p-2 font-normal">
                        {l.name}
                      </th>
                      {dados.series.map((s) => (
                        <td key={s.chave} className="p-2">
                          {typeof l[s.chave] === "number"
                            ? formatarMetrica(l[s.chave] as number, c.metrica)
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}
