import type { ProjectExt } from '../store';

/** Evidências do projeto: status de execução e contatos da organização não comprovam visita. */
export function resumoAcompanhamento(projeto: ProjectExt) {
  const pareceres = projeto.pareceres ?? [];
  const visitas = pareceres.filter(p => p.origem === 'Visita técnica');
  const mudancas = projeto.changes ?? [];
  const ultimaVisita = visitas.map(p => p.data).sort().at(-1) ?? null;
  const ultimaMudanca = mudancas.map(m => m.date).sort().at(-1) ?? null;
  return {
    visitas: visitas.length,
    pareceres: pareceres.length,
    mudancas: mudancas.length,
    ultimaVisita,
    ultimaMudanca,
    temAlteracoes: mudancas.length > 0,
    temAcompanhamento: pareceres.length + mudancas.length > 0,
  };
}
