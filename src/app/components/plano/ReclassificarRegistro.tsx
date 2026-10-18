import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, History } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../auth/authStore';
import { useStore } from '../../store';
import { consultarReclassificacao, consultarHistoricoReclassificacao } from '../../reclassificacaoPlano.server';
import { TIPOS_PLANO, ROTULOS_TIPO, validarReclassificacao, type TipoPlano, type RegistroReclassificacao } from '../../lib/reclassificacaoPlano';
import { Campo, AreaTexto, Erros } from './camposFormulario';
import { BotaoAcao } from './PainelBase';

const rotulosCampos: Record<string, string> = {
  nome: 'Título', responsavel: 'Responsável', resultado_esperado: 'Resultado esperado', observacoes: 'Observações',
  inicio_previsto: 'Início previsto', fim_previsto: 'Fim previsto', inicio_realizado: 'Início realizado', fim_realizado: 'Fim realizado',
  status: 'Situação', progresso: 'Progresso (%)', justificativa_atraso: 'Justificativa de atraso', vinculo_orcamentario: 'Vínculo orçamentário',
  proximo_passo: 'Próximo passo', proximo_passo_responsavel: 'Responsável pelo próximo passo', proximo_passo_prazo: 'Prazo do próximo passo',
  data_planejada: 'Prazo legado', data_inicio: 'Início legado', data_conclusao: 'Conclusão legada',
};
const erroTexto = (e: unknown) => e instanceof Error ? e.message : 'Não foi possível alterar o tipo.';

export function ReclassificarRegistro({ tipo, id, aoConverter, aoOcupar }: {
  tipo: TipoPlano; id: string; aoConverter: (tipo: TipoPlano, id: string) => void; aoOcupar: (ocupado: boolean) => void;
}) {
  const { readOnly } = useAuth();
  const { reclassificarPlano } = useStore();
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [novoTipo, setNovoTipo] = useState<TipoPlano>(tipo === 'meta' ? 'etapa' : 'meta');
  const [paiId, setPaiId] = useState('');
  const [destinos, setDestinos] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const emCurso = useRef(false);
  const previa = useQuery({ queryKey: ['reclassificacao', tipo, id],
    queryFn: () => consultarReclassificacao({ data: { tipo, id } }), enabled: aberto && !readOnly, retry: false, staleTime: 0 });
  const historico = useQuery({ queryKey: ['historico-reclassificacao', id],
    queryFn: () => consultarHistoricoReclassificacao({ data: { id } }), enabled: historicoAberto, retry: false });
  const registros = previa.data?.registros ?? [];
  const dependencias = previa.data?.dependencias ?? [];
  const candidatos = registros.filter(r => r.tipo === tipo);
  const pais = registros.filter(r => r.tipo === (novoTipo === 'etapa' ? 'meta' : 'etapa'));
  const nomeRegistro = (r: RegistroReclassificacao) => {
    const pai = registros.find(p => p.id === r.pai);
    return `${pai ? `${pai.nome} › ` : ''}${r.nome}`;
  };
  const input = () => ({ tipo, id, novoTipo, paiId: novoTipo === 'meta' ? null : paiId,
    token: previa.data?.token ?? '', motivo,
    destinos: dependencias.map(d => ({ chave: d.chave, destinoId: destinos[d.chave] ?? '' })) });
  const revisar = () => {
    try { validarReclassificacao(input()); setErros([]); setRevisando(true); }
    catch (e) { setErros([erroTexto(e)]); }
  };
  const salvar = async () => {
    if (emCurso.current || readOnly) return;
    emCurso.current = true;
    setSalvando(true); aoOcupar(true); setErros([]);
    try {
      const novoId = await reclassificarPlano(input());
      await queryClient.invalidateQueries({ queryKey: ['historico-reclassificacao', id] });
      toast.success(`Registro alterado para ${ROTULOS_TIPO[novoTipo].toLocaleLowerCase('pt-BR')}.`);
      aoOcupar(false); setAberto(false); aoConverter(novoTipo, novoId);
    } catch (e) { setErros([erroTexto(e)]); setRevisando(false); }
    finally { emCurso.current = false; setSalvando(false); aoOcupar(false); }
  };
  const selecao = (rotulo: string, valor: string, mudar: (v: string) => void, opcoes: RegistroReclassificacao[]) => (
    <Campo rotulo={rotulo} obrigatorio>
      <select value={valor} onChange={e => mudar(e.target.value)} disabled={salvando} required
        className="w-full rounded-md border px-2 py-1.5 text-xs bg-card">
        <option value="">Escolha o destino…</option>
        {opcoes.map(r => <option key={r.id} value={r.id}>{nomeRegistro(r)}</option>)}
      </select>
      {opcoes.length === 0 && <span className="text-xs">Não há destino disponível. Cadastre outro registro desse tipo no projeto antes de converter.</span>}
    </Campo>
  );
  return <div className="space-y-3 mb-4">
    {!readOnly && !aberto && <BotaoAcao aoClicar={() => { setAberto(true); setRevisando(false); }}><ArrowRightLeft size={13} /> Alterar tipo</BotaoAcao>}
    {aberto && !readOnly && <Dialog.Root open onOpenChange={v => { if (!salvando) setAberto(v); }}>
      <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
      <Dialog.Content onEscapeKeyDown={e => { if (salvando) e.preventDefault(); }}
        onPointerDownOutside={e => { if (salvando) e.preventDefault(); }}
        className="fixed left-1/2 top-1/2 z-[61] w-[calc(100%_-_2rem)] max-w-2xl max-h-[90dvh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-5 shadow-xl space-y-4">
      <Dialog.Title className="text-lg font-semibold">Alterar tipo{previa.data ? `: ${previa.data.nome}` : ''}</Dialog.Title>
      <Dialog.Description className="text-sm text-muted-foreground">Escolha onde o registro e cada vínculo ficarão. Informações específicas do tipo anterior ficam disponíveis em “Dados anteriores”.</Dialog.Description>
      <Erros erros={[...erros, ...(previa.error ? [erroTexto(previa.error)] : [])]} />
      {previa.isPending && <p role="status" className="text-xs">Carregando os vínculos…</p>}
      {previa.data && !revisando && <>
        <Campo rotulo="Novo tipo" obrigatorio>
          <select className="w-full rounded-md border px-2 py-1.5 text-xs bg-card" value={novoTipo}
            onChange={e => { setNovoTipo(e.target.value as TipoPlano); setPaiId(''); }}>
            {TIPOS_PLANO.filter(t => t !== tipo).map(t => <option key={t} value={t}>{ROTULOS_TIPO[t]}</option>)}
          </select>
        </Campo>
        {novoTipo !== 'meta' && selecao(novoTipo === 'etapa' ? 'Meta que receberá este registro' : 'Etapa que receberá este registro', paiId, setPaiId, pais)}
        {novoTipo === 'meta' && <p className="text-xs">A nova meta ficará diretamente neste projeto.</p>}
        {dependencias.length > 0 && <p className="text-xs font-semibold">Escolha o destino de cada vínculo ({dependencias.length})</p>}
        {dependencias.map(d => <div key={d.chave} className="space-y-1 border-t pt-2">
          <p className="text-xs break-words">{d.grupo}: {d.nome}</p>
          {selecao(`${ROTULOS_TIPO[tipo]} de destino`, destinos[d.chave] ?? '', v => setDestinos(atual => ({ ...atual, [d.chave]: v })), candidatos)}
        </div>)}
        {dependencias.some(d => d.grupo === 'Risco') && <p className="text-xs">Riscos devem continuar na meta de sua etapa. Atividades de resposta e seus riscos devem ficar na mesma etapa.</p>}
        <Campo rotulo="Motivo da correção" obrigatorio><AreaTexto valor={motivo} aoMudar={setMotivo} linhas={2} /></Campo>
        <BotaoAcao aoClicar={revisar}>Revisar alteração</BotaoAcao>
      </>}
      {previa.data && revisando && <div className="space-y-2 text-xs">
        <p><strong>{previa.data.nome}</strong>: {ROTULOS_TIPO[tipo]} → {ROTULOS_TIPO[novoTipo]}</p>
        <p>Destino: {novoTipo === 'meta' ? 'Este projeto' : registros.find(r => r.id === paiId)?.nome}</p>
        <ul className="space-y-1">{dependencias.map(d => <li key={d.chave}>{d.grupo}: {d.nome} → {registros.find(r => r.id === destinos[d.chave])?.nome}</li>)}</ul>
        <p>Motivo: {motivo}</p>
        <p>Os vínculos serão movidos e o conteúdo original ficará registrado no histórico.</p>
        <button type="button" disabled={salvando} onClick={() => void salvar()} className="rounded-md px-3 py-2 bg-primary text-primary-foreground disabled:opacity-50">
          {salvando ? 'Salvando…' : 'Confirmar mudança de tipo'}
        </button>
        <button type="button" disabled={salvando} onClick={() => setRevisando(false)} className="px-3 py-2">Voltar</button>
      </div>}
      <div className="flex gap-3 text-xs">
        <button type="button" disabled={salvando} onClick={() => { setAberto(false); setRevisando(false); setErros([]); }}>Cancelar</button>
        <button type="button" disabled={salvando || previa.isFetching} onClick={() => { setDestinos({}); setRevisando(false); setErros([]); void previa.refetch(); }}>Atualizar prévia</button>
      </div>
      </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>}
    <BotaoAcao aoClicar={() => setHistoricoAberto(v => !v)}><History size={13} /> {historicoAberto ? 'Ocultar dados anteriores' : 'Dados anteriores'}</BotaoAcao>
    {historicoAberto && <section aria-label="Dados anteriores" className="space-y-3 text-xs">
      {historico.isPending && <p role="status">Carregando histórico…</p>}
      {historico.error && <Erros erros={[erroTexto(historico.error)]} />}
      {historico.data?.length === 0 && <p>Este registro ainda não mudou de tipo.</p>}
      {historico.data?.map(h => <details key={h.id} className="border rounded-lg p-2">
        <summary>{ROTULOS_TIPO[h.de_valor]} → {ROTULOS_TIPO[h.para_valor]} · {new Date(h.data).toLocaleString('pt-BR')}</summary>
        <p className="my-2">{h.autor}: {h.payload.motivo}</p>
        <dl className="space-y-2">{Object.entries(h.payload.origem).filter(([k, v]) => rotulosCampos[k] && v !== null && v !== '').map(([k, v]) => <div key={k}>
          <dt className="font-semibold">{rotulosCampos[k]}</dt><dd className="whitespace-pre-wrap break-words">{String(v)}</dd>
        </div>)}</dl>
        {h.payload.vinculos.length > 0 && <p className="mt-2">Vínculos preservados: {h.payload.vinculos.map(v => `${v.grupo}: ${v.nome}`).join('; ')}.</p>}
      </details>)}
    </section>}
  </div>;
}
