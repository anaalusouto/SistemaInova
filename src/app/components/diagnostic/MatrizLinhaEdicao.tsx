import type { KeyboardEvent } from 'react';
import { ATUACAO_MATRIZ, EXPERIENCIA_MATRIZ, NIVEIS_MATRIZ, leituraMatriz } from '../../diagnostic/catalog/matrizPrototipo';
import type { CampoImportado, ConferenciaFuncao, DecisoesImportacao, RascunhoMatriz } from '../../diagnostic/importarMatriz';

export function ConferenciaCampoMatriz({ campo, conferencia, decisao, aoManterVazio }: {
  campo: CampoImportado; conferencia?: ConferenciaFuncao; decisao?: DecisoesImportacao[CampoImportado]; aoManterVazio: () => void;
}) {
  const estado = conferencia?.campos[campo] ?? 'ausente';
  return <span className="block text-xs text-muted-foreground">
    {estado === 'reconhecido' ? 'Reconhecido no PDF · confira antes de salvar' : estado === 'ambiguo' ? 'Ambíguo no PDF · escolha ou corrija este campo' : 'Ausente no PDF · preencha se conhecido'}
    {estado === 'ambiguo' && <>
      <span className="block whitespace-pre-wrap">Valores no PDF: {(conferencia?.valores?.[campo] ?? []).join(' / ') || 'Função ou conteúdo não identificado com segurança'}</span>
      <button type="button" className="underline" onClick={aoManterVazio}>Manter como não identificado</button>
      {decisao && <span className="block">{decisao === 'corrigido' ? 'Resposta corrigida para conferência' : 'Decisão: dado não identificado'}</span>}
    </>}
  </span>;
}

/** Células editáveis usam o mesmo rascunho e a mesma gravação do pop-up. */
export function MatrizLinhaEdicao({ id, formularioId, valores, estado, bloqueado, pendente, importada, conferencia, decisoes, confirmado,
  erro, aoAlterar, aoNaoIdentificado, aoConferir, aoSalvar, aoCancelar }: {
  id: string; formularioId: string; valores: RascunhoMatriz; estado: string; bloqueado: boolean; pendente: boolean;
  importada: boolean; conferencia?: ConferenciaFuncao; decisoes: DecisoesImportacao; confirmado: boolean;
  erro?: string;
  aoAlterar: <K extends CampoImportado>(campo: K, valor: RascunhoMatriz[K]) => void;
  aoNaoIdentificado: (campo: CampoImportado) => void; aoConferir: (valor: boolean) => void; aoSalvar: () => void; aoCancelar: () => void;
}) {
  const classe = 'w-full min-w-36 rounded-lg border bg-card p-2 text-sm disabled:opacity-60';
  const teclado = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!bloqueado) aoCancelar(); }
    if (e.key === 'Enter' && e.currentTarget.tagName !== 'TEXTAREA' && !e.nativeEvent.isComposing) {
      e.preventDefault(); e.currentTarget.form?.requestSubmit();
    }
  };
  const status = (campo: CampoImportado) => importada ? <ConferenciaCampoMatriz campo={campo} conferencia={conferencia} decisao={decisoes[campo]} aoManterVazio={() => aoNaoIdentificado(campo)} /> : null;
  const selecao = (rotulo: string, campo: 'atuacao' | 'experiencia' | 'criticidade' | 'interesse', opcoes: readonly string[]) => <>
    <select aria-label={`${rotulo} ${id}`} form={formularioId} disabled={bloqueado} className={classe} value={valores[campo] ?? ''} onKeyDown={teclado} onChange={e => aoAlterar(campo, e.target.value || null)}>
      <option value="">Não informado</option>{opcoes.map(o => <option key={o} value={o}>{o}</option>)}
    </select>{status(campo)}
  </>;
  const texto = (rotulo: string, campo: 'observacoes' | 'externo') => <>
    <textarea aria-label={`${rotulo} ${id}`} form={formularioId} disabled={bloqueado} rows={3} maxLength={20000} className={`${classe} min-w-48`} value={valores[campo] ?? ''} onKeyDown={teclado} onChange={e => aoAlterar(campo, e.target.value || null)} />{status(campo)}
  </>;
  return <>
    <th scope="row"><span className="block mb-2 text-xs text-muted-foreground">{id} · {estado}</span><span className="block min-w-60 font-medium">{valores.nomeFuncao}</span>{pendente && <span className="block mt-2 text-xs font-normal">Alterações não salvas</span>}</th>
    <td>{selecao('Atuação', 'atuacao', ATUACAO_MATRIZ)}</td>
    <td>{texto('Externo', 'externo')}</td>
    <td>{selecao('Experiência', 'experiencia', EXPERIENCIA_MATRIZ)}</td>
    <td>{selecao('Interesse em desenvolvimento', 'interesse', NIVEIS_MATRIZ)}</td>
    <td>{selecao('Criticidade atual', 'criticidade', NIVEIS_MATRIZ)}</td>
    <td><span className="diagnostico-leitura">{leituraMatriz(valores.criticidade, valores.experiencia)}</span></td>
    <td>{texto('Observação', 'observacoes')}</td>
    <td>
      <form id={formularioId} aria-label={`Salvar função ${id}`} onSubmit={e => { e.preventDefault(); if (!bloqueado) aoSalvar(); }} className="min-w-44 space-y-2">
        <fieldset disabled={bloqueado} className="space-y-2">
          {importada && <label className="flex items-start gap-2 text-xs"><input type="checkbox" required checked={confirmado} onChange={e => aoConferir(e.target.checked)} />Conferi esta função e as decisões dos campos ambíguos. Campos não identificados permanecerão vazios.</label>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={!pendente} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs disabled:opacity-50">Salvar linha</button>
            <button type="button" disabled={!pendente} onClick={aoCancelar} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-50">Cancelar</button>
          </div>
        </fieldset>
        {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
      </form>
    </td>
  </>;
}
