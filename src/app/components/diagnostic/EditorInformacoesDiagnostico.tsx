import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { atualizarInformacoesGeraisDiagnostico, getInformacoesGeraisDiagnostico, getParecer, listarProdutos, listarRespostasMatriz, type DiagnosticoResumo, type Produto } from '../../diagnosticos.server';
import { useCaderno, CadernoItens, type ContextoCaderno } from './CadernoItens';
import { MatrizFuncionalTab } from './MatrizFuncionalTab';
import { QuestionarioCaderno } from './QuestionarioCaderno';
import { CestaCaderno } from './CestaCaderno';
import { ParecerTecnicoTab } from './ParecerTecnicoTab';
import { calcularIeoCaderno, DIMENSOES_IEO_CADERNO } from '../../diagnostic/ieoCaderno';
import { AVALIACOES_OPERACAO, COMPLEMENTARES_CADERNO, EVIDENCIAS_CADERNO, IDENTIFICACAO_CADERNO, IMPLANTACAO_CADERNO, ITENS_CADERNO, PERFIL_CESTA, PORTFOLIO_CESTA, QUESTIONARIO_CADERNO, type ItemCaderno } from '../../diagnostic/catalog/cadernoCria';

const SECOES = ['Dados gerais','Identificação','Matriz Funcional','Questões do IEO','Dimensões do IEO','Produtos e serviços','Avaliação produtiva','Contexto produtivo','Implantação','Conclusão geral do mapeamento','Direcionamentos','Evidências','Nomes das operações','Textos e orientações'] as const;
type Secao = typeof SECOES[number];
type RegistroEditor = { id: string; titulo: string; detalhe?: string; tipo: 'geral'|'caderno'|'dimensao'|'matriz'|'cesta'|'parecer'|'evidencia'|'static'; item?: ItemCaderno; contexto?: string; produto?: Produto };
const vazioGeral = { nomeOrganizacao:'', classificacao:'', dataAplicacao:'', versao:0, arquivoReferencia:'', estagioRegistrado:'' };

export function EditorInformacoesDiagnostico({ diagnostico, organizacaoId, readOnly, secaoInicial='Dados gerais', haPendencias, aoFechar, aoGerenciarEvidencias }: ContextoCaderno & {
  diagnostico: DiagnosticoResumo; secaoInicial?: Secao; haPendencias: boolean; aoFechar:()=>void; aoGerenciarEvidencias:()=>void;
}) {
  const client = useQueryClient();
  const [secao, setSecao] = useState<Secao>(secaoInicial);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState('');
  const [geral, setGeral] = useState(vazioGeral);
  const [geralSalvo, setGeralSalvo] = useState(JSON.stringify(vazioGeral));
  const [busy, setBusy] = useState(false);
  const geralQuery = useQuery({ queryKey:['diagnostico-geral-editor',diagnostico.id], queryFn:()=>getInformacoesGeraisDiagnostico({data:{diagnosticoId:diagnostico.id}}) });
  const caderno = useCaderno({diagnosticoId:diagnostico.id,organizacaoId});
  const matriz = useQuery({queryKey:['diagnostico-matriz',diagnostico.id,organizacaoId],queryFn:()=>listarRespostasMatriz({data:{diagnosticoId:diagnostico.id,organizacaoId}})});
  const produtosQuery = useQuery({queryKey:['diagnostico-produtos',diagnostico.id],queryFn:()=>listarProdutos({data:{diagnosticoId:diagnostico.id}})});
  const parecerQuery = useQuery({queryKey:['diagnostico-parecer',diagnostico.id],queryFn:()=>getParecer({data:{diagnosticoId:diagnostico.id}})});
  const resultadoIeo = calcularIeoCaderno(caderno.data??[]);
  const produtos = produtosQuery.data??[];
  const operacoes = [...new Set((caderno.data??[]).map(r=>r.contexto).filter(v=>/^OP\d{2,}$/.test(v)))].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
  const records = useMemo<RegistroEditor[]>(()=>{
    const catalog = (items:ItemCaderno[], context='') => items.map(item=>({id:`${context}:${item.codigo}`,titulo:item.codigo,detalhe:item.texto,tipo:'caderno' as const,item,contexto:context}));
    switch(secao){
      case 'Dados gerais': return [{id:'geral',titulo:'Organização, aplicação e situação',tipo:'geral'}];
      case 'Identificação': return catalog(IDENTIFICACAO_CADERNO);
      case 'Matriz Funcional': return [{id:'matriz',titulo:'Registros das funções F01–F21',detalhe:`${matriz.data?.length??0} funções registradas`,tipo:'matriz'}];
      case 'Questões do IEO': return catalog(QUESTIONARIO_CADERNO);
      case 'Dimensões do IEO': return DIMENSOES_IEO_CADERNO.map(d=>({id:d.id,titulo:`${d.id}. ${d.titulo}`,detalhe:`Média ${resultadoIeo.porDimensao.find(r=>r.dimensaoId===d.id)?.media?.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})??'—'} · ${d.perguntas.length} perguntas`,tipo:'dimensao'}));
      case 'Produtos e serviços': return produtos.length?produtos.map(p=>({id:p.id,titulo:p.nome||'Produto sem nome',detalhe:`${p.id} · ${p.statusPreenchimento.replaceAll('_',' ')}`,tipo:'cesta',produto:p})): [{id:'cesta',titulo:'Produtos, serviços e operações',detalhe:'Nenhum produto/serviço cadastrado',tipo:'cesta'}];
      case 'Avaliação produtiva': return operacoes.flatMap(op=>catalog(AVALIACOES_OPERACAO,op));
      case 'Contexto produtivo': return produtos.flatMap(p=>catalog(PERFIL_CESTA,p.id));
      case 'Implantação': return operacoes.flatMap(op=>catalog(IMPLANTACAO_CADERNO,op));
      case 'Conclusão geral do mapeamento': return [{id:'parecer',titulo:'Síntese e análise técnica',detalhe:'Conclusão, capacidades, fragilidades e prioridades',tipo:'parecer'}];
      case 'Direcionamentos': return catalog(COMPLEMENTARES_CADERNO.filter(i=>i.grupo==='Fechamento estratégico'||i.grupo==='Prioridades pactuadas'));
      case 'Evidências': return (parecerQuery.data?.evidenciasVinculadas??[]).map((e,i)=>({id:e.id??e.codigo??String(i),titulo:`${e.codigo??'Evidência'} · ${e.titulo??e.tipo??'Sem título'}`,detalhe:e.codigosRelacionados??e.referencia??'',tipo:'evidencia'}));
      case 'Nomes das operações': return produtos.flatMap(p=>catalog(PORTFOLIO_CESTA,p.id));
      case 'Textos e orientações': return catalog(ITENS_CADERNO);
    }
  },[secao,matriz.data,resultadoIeo,produtos,operacoes,parecerQuery.data]);
  const filtrados = records.filter(r=>`${r.titulo} ${r.detalhe??''}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')));
  const atual = records.find(r=>r.id===selecionado)??filtrados[0]??null;
  const dirtyGeral = JSON.stringify(geral)!==geralSalvo;
  useEffect(()=>{if(geralQuery.data){setGeral(geralQuery.data);setGeralSalvo(JSON.stringify(geralQuery.data));}},[geralQuery.data]);
  useEffect(()=>{setBusca('');setSelecionado('');},[secao]);
  useEffect(()=>{if(!selecionado&&filtrados[0])setSelecionado(filtrados[0].id);},[filtrados,selecionado]);
  const fechar=()=>{if((dirtyGeral||haPendencias)&&!window.confirm('Há alterações pendentes. Feche somente depois de salvar ou cancelar os formulários abertos.'))return;aoFechar();};
  const mudarSecao=(nova:Secao)=>{if(dirtyGeral||haPendencias){toast.error('Salve ou cancele as alterações pendentes antes de trocar de seção.');return;}setSecao(nova);};
  const salvarGeral=async()=>{
    setBusy(true);
    try{
      const atualizado=await atualizarInformacoesGeraisDiagnostico({data:{diagnosticoId:diagnostico.id,organizacaoId,nomeOrganizacao:geral.nomeOrganizacao,classificacao:geral.classificacao,dataAplicacao:geral.dataAplicacao,arquivoReferencia:geral.arquivoReferencia,estagioRegistrado:geral.estagioRegistrado}});
      setGeralSalvo(JSON.stringify(geral));
      await Promise.all([client.invalidateQueries({queryKey:['diagnostico',diagnostico.id]}),client.invalidateQueries({queryKey:['diagnosticos']}),client.invalidateQueries({queryKey:['comunidades']}),client.invalidateQueries({queryKey:['diagnostico-geral-editor',diagnostico.id]}),client.invalidateQueries({queryKey:['diagnostico-parecer',diagnostico.id]})]);
      toast.success(`Informações salvas para a versão ${atualizado.versao}.`);
    }catch(e){toast.error(e instanceof Error?e.message:'Não foi possível salvar as informações.');}
    finally{setBusy(false);}
  };
  const adicionar=()=>{
    if(secao==='Evidências'){aoGerenciarEvidencias();return;}
    if(secao==='Produtos e serviços'||secao==='Nomes das operações'){setSelecionado('cesta');return;}
    toast.info('Esta seção usa um catálogo fixo. Selecione um dos registros listados para editar.');
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-2 sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget)fechar();}}>
    <section role="dialog" aria-modal="true" aria-labelledby="editar-info-titulo" className="flex max-h-[calc(100dvh-1rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border bg-card shadow-xl sm:max-h-[calc(100dvh-2.5rem)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5"><div><h2 id="editar-info-titulo" className="text-xl font-bold">Editar informações</h2><p className="mt-1 text-sm text-muted-foreground">Revise um registro e salve as alterações no painel.</p></div><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={fechar} aria-label="Fechar editor">Fechar</button></header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="min-h-0 border-b p-3 lg:overflow-y-auto lg:border-b-0 lg:border-r"><label className="block text-xs font-semibold">Seção<select className="mt-1 w-full rounded-lg border bg-card p-2.5 text-sm" value={secao} onChange={e=>mudarSecao(e.target.value as Secao)}>{SECOES.map(s=><option key={s}>{s}</option>)}</select></label>
          <label className="mt-3 block text-xs font-semibold">Buscar registro<input className="mt-1 w-full rounded-lg border bg-card p-2.5 text-sm" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Código ou título" /></label>
          <button type="button" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50" disabled={readOnly||!['Produtos e serviços','Nomes das operações','Evidências'].includes(secao)} onClick={adicionar}>Adicionar registro</button>
          <div className="mt-3 space-y-1" aria-label={`Registros da seção ${secao}`}>
            {filtrados.map(r=><button type="button" key={r.id} className={`w-full rounded-lg border p-2.5 text-left ${atual?.id===r.id?'border-primary bg-primary/10':'border-transparent hover:border-border'}`} onClick={()=>{if(dirtyGeral||haPendencias){toast.error('Salve ou cancele as alterações pendentes antes de selecionar outro registro.');return;}setSelecionado(r.id);}}><strong className="block text-xs">{r.titulo}</strong>{r.detalhe&&<span className="mt-1 block line-clamp-2 text-[11px] text-muted-foreground">{r.detalhe}</span>}</button>)}
            {!filtrados.length&&<p className="rounded-lg border p-3 text-xs text-muted-foreground">Nenhum registro nesta seção corresponde à busca.</p>}
          </div>
        </aside>
        <main className="min-h-0 overflow-y-auto p-3 sm:p-5">
          {dirtyGeral&&<p role="status" className="sticky top-0 z-10 mb-3 rounded-lg border bg-amber-50 px-3 py-2 text-sm text-amber-900">Alterações pendentes neste registro.</p>}
          {atual?.tipo==='geral'&&<section className="mx-auto max-w-3xl space-y-4"><h3 className="text-lg font-semibold">Dados gerais</h3>{geralQuery.isLoading?<p role="status">Carregando dados da aplicação…</p>:<>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Organização" value={geral.nomeOrganizacao} disabled={readOnly} onChange={v=>setGeral(x=>({...x,nomeOrganizacao:v}))}/><Field label="Classificação" value={geral.classificacao} disabled={readOnly} onChange={v=>setGeral(x=>({...x,classificacao:v}))}/><Field label="Data de aplicação" type="date" value={geral.dataAplicacao} disabled={readOnly} onChange={v=>setGeral(x=>({...x,dataAplicacao:v}))}/><Field label="Versão dos dados" value={String(geral.versao)} readOnly/><Field label="Arquivo de referência" value={geral.arquivoReferencia} disabled={readOnly} onChange={v=>setGeral(x=>({...x,arquivoReferencia:v}))}/><Field label="Estágio registrado" value={geral.estagioRegistrado} disabled={readOnly} onChange={v=>setGeral(x=>({...x,estagioRegistrado:v}))}/></div>
            <div className="grid gap-3 sm:grid-cols-2"><Calculated label="IEO geral calculado" value={`${resultadoIeo.geral?.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})??'—'} / 4`}/><Calculated label="Situação do IEO calculada" value={resultadoIeo.pontuadas>0&&resultadoIeo.pontuadas+resultadoIeo.naoAplicaveis===resultadoIeo.total?'Completo':'Parcial ou pendente'}/></div>
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">O IEO e sua situação são calculados a partir das questões. O estágio registrado é uma classificação descritiva e pode ser revisado. Os campos calculados não são editáveis.</p>
            {!readOnly&&<ActionBar dirty={dirtyGeral} busy={busy} onCancel={()=>{if(geralQuery.data){setGeral(geralQuery.data);setGeralSalvo(JSON.stringify(geralQuery.data));}}} onSave={()=>void salvarGeral()}/>}</>}</section>}
          {atual?.tipo==='caderno'&&atual.item&&<section className="mx-auto max-w-3xl space-y-3"><h3 className="text-lg font-semibold">{atual.titulo} · {atual.item.texto}</h3><p className="text-xs text-muted-foreground">A gravação e o cancelamento usam o formulário próprio do registro. Campos vazios permanecem sem preenchimento.</p><CadernoItens {...{diagnosticoId:diagnostico.id,organizacaoId,readOnly}} itens={[atual.item]} contexto={atual.contexto}/></section>}
          {atual?.tipo==='matriz'&&<section className="space-y-3"><h3 className="text-lg font-semibold">Matriz Funcional</h3><p className="text-sm text-muted-foreground">Use a busca e a seleção de função no formulário da Matriz. Avaliação, leitura orientativa e observações mantêm seus salvamentos explícitos.</p><MatrizFuncionalTab diagnosticoId={diagnostico.id} organizacaoId={organizacaoId} readOnly={readOnly}/></section>}
          {atual?.tipo==='cesta'&&<section className="space-y-3"><h3 className="text-lg font-semibold">Produtos e serviços</h3><p className="text-sm text-muted-foreground">Use os registros da Cesta para editar identificação, contexto produtivo, avaliação, canais e implantação.</p><CestaCaderno diagnosticoId={diagnostico.id} organizacaoId={organizacaoId} readOnly={readOnly}/></section>}
          {atual?.tipo==='parecer'&&<section className="space-y-3"><h3 className="text-lg font-semibold">Conclusão e direcionamentos</h3><ParecerTecnicoTab diagnosticoId={diagnostico.id} organizacaoId={organizacaoId} readOnly={readOnly}/></section>}
          {atual?.tipo==='dimensao'&&(()=>{const d=DIMENSOES_IEO_CADERNO.find(x=>x.id===atual.id)!;const r=resultadoIeo.porDimensao.find(x=>x.dimensaoId===d.id)!;return <section className="max-w-2xl space-y-3"><h3 className="text-lg font-semibold">{d.id}. {d.titulo}</h3><Calculated label="Média calculada" value={`${r.media?.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})??'—'} / 4`}/><p className="text-sm text-muted-foreground">{r.pontuadas} indicadores com nota · {r.naoAplicaveis} N/A · {r.semNota} sem nota. A dimensão é calculada pelas respostas vinculadas aos códigos oficiais; não é editável manualmente.</p><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={()=>mudarSecao('Questões do IEO')}>Ir às questões do IEO</button></section>;})()}
          {atual?.tipo==='evidencia'&&<section className="max-w-2xl space-y-3"><h3 className="text-lg font-semibold">{atual.titulo}</h3><p className="text-sm text-muted-foreground">O cadastro detalhado e os anexos são gerenciados no painel de evidências desta aplicação.</p><button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={aoGerenciarEvidencias}>Abrir Evidências</button></section>}
          {atual?.tipo==='static'&&<section className="max-w-3xl space-y-3"><h3 className="text-lg font-semibold">{atual.titulo}</h3><p className="text-sm text-muted-foreground">{atual.detalhe}</p><p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">Texto e orientação do catálogo da plataforma. Este registro é fixo e não altera os dados da organização.</p></section>}
          {!atual&&<p className="rounded-xl border p-5 text-sm text-muted-foreground">Selecione uma seção e um registro para editar.</p>}
        </main>
      </div>
    </section>
  </div>;
}

function Field({label,value,onChange,disabled,readOnly,type='text'}:{label:string;value:string;onChange?:(v:string)=>void;disabled?:boolean;readOnly?:boolean;type?:string}){return <label className="block text-xs font-semibold">{label}<input type={type} className="mt-1 w-full rounded-lg border bg-card p-2.5 text-sm font-normal" value={value} disabled={disabled} readOnly={readOnly} onChange={onChange?e=>onChange(e.target.value):undefined}/></label>;}
function Calculated({label,value}:{label:string;value:string}){return <div className="rounded-lg border bg-muted/50 p-3"><p className="text-xs font-semibold">{label} · calculado</p><p className="mt-1 text-lg font-bold">{value}</p></div>;}
function ActionBar({dirty,busy,onCancel,onSave}:{dirty:boolean;busy:boolean;onCancel:()=>void;onSave:()=>void}){return <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-card/95 py-3 backdrop-blur"><p className="text-xs text-muted-foreground">{dirty?'Há alterações pendentes.':'Nenhuma alteração pendente.'}</p><div className="flex gap-2"><button type="button" className="rounded-lg border px-3 py-2 text-sm" disabled={!dirty||busy} onClick={onCancel}>Cancelar</button><button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50" disabled={!dirty||busy} onClick={onSave}>{busy?'Salvando…':'Salvar alterações'}</button></div></div>;}

function useRecords(secao:Secao,products:Produto[],ops:string[],matrizCount:number,dimensoes:typeof DIMENSOES_IEO_CADERNO):RegistroEditor[]{
  switch(secao){
    case 'Dados gerais':return [{id:'geral',titulo:'Dados gerais',tipo:'geral'}];
    case 'Identificação':return IDENTIFICACAO_CADERNO.map(i=>({id:i.codigo,titulo:i.codigo,detalhe:i.texto,tipo:'caderno',item:i}));
    case 'Matriz Funcional':return [{id:'matriz',titulo:'Matriz Funcional',detalhe:`${matrizCount} funções registradas`,tipo:'matriz'}];
    case 'Questões do IEO':return QUESTIONARIO_CADERNO.map(i=>({id:i.codigo,titulo:i.codigo,detalhe:i.texto,tipo:'caderno',item:i}));
    case 'Dimensões do IEO':return dimensoes.map(d=>({id:d.id,titulo:`${d.id}. ${d.titulo}`,tipo:'dimensao'}));
    case 'Produtos e serviços':return products.length?products.map(p=>({id:p.id,titulo:p.nome||'Produto sem nome',detalhe:p.id,tipo:'cesta',produto:p})):[{id:'cesta',titulo:'Produtos e serviços',detalhe:'Nenhum registro listado',tipo:'cesta'}];
    case 'Avaliação produtiva':return ops.flatMap(ctx=>AVALIACOES_OPERACAO.map(i=>({id:`${ctx}:${i.codigo}`,titulo:`${ctx} · ${i.codigo}`,detalhe:i.texto,tipo:'caderno' as const,item:i,contexto:ctx})));
    case 'Contexto produtivo':return products.flatMap(p=>PERFIL_CESTA.map(i=>({id:`${p.id}:${i.codigo}`,titulo:`${p.nome} · ${i.codigo}`,detalhe:i.texto,tipo:'caderno' as const,item:i,contexto:p.id})));
    case 'Implantação':return ops.flatMap(ctx=>IMPLANTACAO_CADERNO.map(i=>({id:`${ctx}:${i.codigo}`,titulo:`${ctx} · ${i.codigo}`,detalhe:i.texto,tipo:'caderno' as const,item:i,contexto:ctx})));
    case 'Conclusão geral do mapeamento':return [{id:'parecer',titulo:'Conclusão técnica',detalhe:'Síntese e análise do mapeamento',tipo:'parecer'}];
    case 'Direcionamentos':return COMPLEMENTARES_CADERNO.filter(i=>i.grupo==='Fechamento estratégico'||i.grupo==='Prioridades pactuadas').map(i=>({id:i.codigo,titulo:i.codigo,detalhe:i.texto,tipo:'caderno',item:i}));
    case 'Evidências':return EVIDENCIAS_CADERNO.map(i=>({id:i.codigo,titulo:i.codigo,detalhe:i.texto,tipo:'static',item:i}));
    case 'Nomes das operações':return products.length?products.map(p=>({id:p.id,titulo:p.nome||'Operação sem nome',detalhe:p.id,tipo:'cesta',produto:p})):[{id:'cesta',titulo:'Nomes das operações',detalhe:'Nenhum produto/serviço cadastrado',tipo:'cesta'}];
    case 'Textos e orientações':return ITENS_CADERNO.map(i=>({id:i.codigo,titulo:i.codigo,detalhe:i.texto,tipo:'static',item:i}));
  }
}
