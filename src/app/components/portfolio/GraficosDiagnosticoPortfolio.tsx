import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ProjectExt } from '../../store';
import { listarDiagnosticosPorComunidade, listarRespostasMatriz, listarProdutos, listarCategoriasProduto } from '../../diagnosticos.server';
import { listarRespostasCaderno } from '../../caderno.server';
import { diagnosticoAtual } from '../../diagnostic/navegacaoDiagnostico';
import { calcularIeoCaderno, DIMENSOES_IEO_CADERNO } from '../../diagnostic/ieoCaderno';
import { FUNCOES_MATRIZ, leituraMatriz } from '../../diagnostic/catalog/matrizPrototipo';

const PRODUCAO = ['C02','C03','C04','C10','C11','C12'];
const GESTAO = ['C01','C05','C06','C07','C08','C09'];
const media = (ns: number[]) => ns.length ? ns.reduce((a,b)=>a+b,0)/ns.length : null;

export function GraficosDiagnosticoPortfolio({ projects, demonstrativo }: { projects: ProjectExt[]; demonstrativo: boolean }) {
  const [agrupar, setAgrupar] = useState<'organizacao'|'categoria'>('organizacao');
  const orgs = [...new Map(projects.flatMap(p => p.organizacao?.id ? [[p.organizacao.id, p.organizacao.nome] as const] : [])).entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  const consulta = useQuery({ queryKey: ['portfolio-detalhes-mapeamento', orgs.map(([id])=>id)], enabled: !demonstrativo && orgs.length > 0, queryFn: async () => Promise.all(orgs.map(async ([id,nome]) => {
    const atual = diagnosticoAtual(await listarDiagnosticosPorComunidade({data:{comunidadeId:id}}),id);
    if (!atual) return null;
    const [registros, matriz, produtos, categorias] = await Promise.all([
      listarRespostasCaderno({data:{diagnosticoId:atual.id,organizacaoId:id}}), listarRespostasMatriz({data:{diagnosticoId:atual.id,organizacaoId:id}}),
      listarProdutos({data:{diagnosticoId:atual.id}}), listarCategoriasProduto({data:{diagnosticoId:atual.id}}),
    ]);
    return {id,nome,registros,matriz,produtos,categorias};
  })) });
  if (demonstrativo) return <p className="text-sm text-muted-foreground">Os gráficos de mapeamento usam dados reais. Selecione Dados reais para consultá-los.</p>;
  if (consulta.isLoading) return <p role="status">Carregando mapeamentos…</p>;
  if (consulta.error) return <p role="alert">Não foi possível carregar os mapeamentos. <button className="underline" onClick={()=>void consulta.refetch()}>Tentar novamente</button></p>;
  const dados = (consulta.data ?? []).filter((x): x is NonNullable<typeof x> => x !== null);
  const dimensoes = DIMENSOES_IEO_CADERNO.map(d=>({nome:d.titulo, valor:media(dados.flatMap(o=>{const v=calcularIeoCaderno(o.registros).porDimensao.find(x=>x.dimensaoId===d.id)?.media;return v == null ? [] : [v];}))}));
  const lacunas = FUNCOES_MATRIZ.map(f=>({nome:f.nome,valor:dados.reduce((n,o)=>n+o.matriz.filter(r=>r.funcaoId===f.id && leituraMatriz(r.criticidade ?? null,r.experiencia ?? null)==='Lacuna crítica').length,0)})).filter(x=>x.valor>0).sort((a,b)=>b.valor-a.valor);
  const avaliacoes = (codigos:string[]) => {
    const grupos = new Map<string,number[]>();
    for (const o of dados) for (const p of o.produtos) {
      const nome = agrupar==='organizacao' ? o.nome : o.categorias.find(c=>c.id===p.categoriaId)?.nome ?? 'Sem categoria';
      const valores = o.registros.filter(r=>r.contexto===p.id && codigos.includes(r.codigo) && /^[1-4]$/.test(r.resposta.valor ?? '')).map(r=>Number(r.resposta.valor));
      if (valores.length) grupos.set(nome,[...(grupos.get(nome)??[]),...valores]);
    }
    return [...grupos].map(([nome,valores])=>({nome,valor:media(valores)}));
  };
  const distribuicao = (codigo:string) => {
    const totais = new Map<string,number>();
    for (const o of dados) for (const r of o.registros.filter(x=>x.codigo===codigo)) for (const opcao of r.resposta.selecoes) totais.set(opcao,(totais.get(opcao)??0)+1);
    return [...totais].map(([nome,valor])=>({nome,valor})).sort((a,b)=>b.valor-a.valor);
  };
  return <div className="space-y-5"><Grafico titulo="Média das notas do Índice Geral por dimensão" dados={dimensoes} linha />
    <Grafico titulo="Distribuição das funções indicadas como lacuna crítica" dados={lacunas} horizontal />
    <label className="flex items-center gap-2 text-sm">Agrupar avaliações por <select className="rounded border bg-card p-2" value={agrupar} onChange={e=>setAgrupar(e.target.value as typeof agrupar)}><option value="organizacao">Organização</option><option value="categoria">Categoria</option></select></label>
    <Grafico titulo="Média das avaliações de Produção e Qualidade" dados={avaliacoes(PRODUCAO)} linha />
    <Grafico titulo="Média das avaliações de Gestão, mercado e riscos" dados={avaliacoes(GESTAO)} linha />
    <Grafico titulo="Limitações Produtivas" dados={distribuicao('CP08')} horizontal />
    <Grafico titulo="Dificuldades Comerciais" dados={distribuicao('CP09')} horizontal />
    <Grafico titulo="Eventos Climáticos" dados={distribuicao('CP10')} horizontal />
  </div>;
}

function Grafico({titulo,dados,horizontal=false,linha=false}:{titulo:string;dados:{nome:string;valor:number|null}[];horizontal?:boolean;linha?:boolean}) {
  const validos=dados.filter(d=>d.valor!==null);
  const geral=media(validos.map(d=>d.valor!));
  return <section className="min-w-0 rounded-xl border bg-card p-4"><h2 className="font-semibold">{titulo}</h2>{!validos.length ? <p className="py-8 text-sm text-muted-foreground">Não há dados registrados para este recorte.</p> : <div className="mt-3 min-w-0 w-full" style={{height: horizontal ? Math.max(260, validos.length*34) : 340}}><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={validos} layout={horizontal?'vertical':'horizontal'} margin={{top:20,right:20,bottom:horizontal?10:80,left:0}}><CartesianGrid strokeDasharray="3 3"/><XAxis type={horizontal?'number':'category'} dataKey={horizontal?undefined:'nome'} angle={horizontal?0:-25} textAnchor={horizontal?'middle':'end'} interval={0} tick={{fontSize:10}}/><YAxis type={horizontal?'category':'number'} dataKey={horizontal?'nome':undefined} width={horizontal?160:40} domain={linha?[0,4]:undefined} tick={{fontSize:10}}/><Tooltip/><Bar dataKey="valor" name="Valor" fill="#426b9b"/>{linha && geral!==null && <ReferenceLine y={geral} stroke="#b44747" label={`Média ${geral.toLocaleString('pt-BR',{maximumFractionDigits:1})}`}/>}</BarChart></ResponsiveContainer></div>}</section>;
}
