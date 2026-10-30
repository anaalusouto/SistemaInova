import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { excluirDiagnostico, type DiagnosticoResumo } from '../../diagnosticos.server';
import { useAuth } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';
import { formatDateOnly } from '../../lib/dateOnly';

export function ExcluirDiagnosticoButton({ diagnostico, nomeOrganizacao, onExcluido }: {
  diagnostico: DiagnosticoResumo; nomeOrganizacao: string; onExcluido?: () => void;
}) {
  const { readOnly, user } = useAuth();
  const { log } = useAudit();
  const client = useQueryClient();
  const exclusao = useMutation({
    mutationKey: ['excluir-diagnostico', diagnostico.id],
    mutationFn: () => excluirDiagnostico({ data: { id: diagnostico.id, comunidadeId: diagnostico.comunidadeId, atualizadoEm: diagnostico.atualizadoEm, confirmacao: 'EXCLUIR' } }),
    onSuccess: resultado => {
      client.removeQueries({ predicate: q => q.queryKey.includes(diagnostico.id) });
      void client.invalidateQueries({ queryKey: ['diagnosticos', diagnostico.comunidadeId] });
      void client.invalidateQueries({ queryKey: ['diagnostico-visao-geral'] });
      void client.invalidateQueries({ queryKey: ['diagnosticos-concluidos-relatorio'] });
      log({ userLogin: user?.login ?? '—', area: 'mapeamento', action: 'excluir mapeamento', detail: `${nomeOrganizacao} · versão ${diagnostico.versao} · ${diagnostico.id}`, kind: 'alteracao' });
      if (resultado.arquivosPendentes) toast.warning('Mapeamento excluído. A limpeza de alguns anexos no armazenamento falhou e precisa ser verificada pela equipe.');
      else toast.success('Mapeamento excluído.');
      onExcluido?.();
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível excluir o mapeamento.'),
  });
  if (readOnly) return null;
  return <button type="button" disabled={exclusao.isPending} aria-label={`Excluir versão ${diagnostico.versao} de ${nomeOrganizacao}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-2 disabled:opacity-50" onClick={() => {
    if (exclusao.isPending) return;
    if (window.confirm(`Excluir definitivamente o mapeamento de ${nomeOrganizacao}?\n\nVersão ${diagnostico.versao} · aplicação ${formatDateOnly(diagnostico.dataAplicacao)}.\n\nSerão excluídos Matriz, IEO, Cesta, Parecer, respostas do caderno e anexos exclusivos desta aplicação. A organização e os demais mapeamentos serão preservados.\n\nEsta ação não pode ser desfeita.`)) exclusao.mutate();
  }}><Trash2 size={14} aria-hidden />{exclusao.isPending ? 'Excluindo…' : 'Excluir'}</button>;
}
