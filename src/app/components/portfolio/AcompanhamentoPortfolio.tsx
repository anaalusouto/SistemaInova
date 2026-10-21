import { useMemo, useState } from 'react';
import type { ProjectExt } from '../../store';
import { resumoAcompanhamento } from '../../lib/acompanhamentoPortfolio';
import { formatDateOnly } from '../../lib/dateOnly';
import type { ProjectStatus } from '../../data/mockData';
import { TagStatusProjeto } from './TagStatusProjeto';

const filtros = [
  ['acompanhados', 'Com acompanhamento'],
  ['visitados', 'Com visita registrada'],
  ['alterados', 'Com mudanças'],
  ['sem-registro', 'Sem acompanhamento registrado'],
  ['todos', 'Todos'],
] as const;
type Filtro = typeof filtros[number][0];

export function AcompanhamentoPortfolio({ projects, onOpenProject, onChangeStatus }: {
  projects: ProjectExt[];
  onOpenProject?: (id: number) => void;
  onChangeStatus?: (id: number, status: ProjectStatus) => Promise<void>;
}) {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const linhas = useMemo(() => projects.map(projeto => ({ projeto, ...resumoAcompanhamento(projeto) })), [projects]);
  const visiveis = linhas.filter(l => filtro === 'todos' || (filtro === 'acompanhados' ? l.temAcompanhamento
    : filtro === 'visitados' ? l.visitas > 0 : filtro === 'alterados' ? l.temAlteracoes : !l.temAcompanhamento));

  return <section className="rounded-xl border bg-card p-4 sm:p-5" style={{ borderColor: 'var(--border)' }} aria-labelledby="acompanhamento-titulo">
    <h2 id="acompanhamento-titulo" className="font-semibold text-base">Acompanhamento dos projetos</h2>
    <p className="mt-1 text-xs text-muted-foreground">Veja quais projetos já têm visitas, pareceres ou mudanças registradas. A visita é comprovada por parecer de Visita técnica.</p>
    <p className="mt-1 text-xs text-muted-foreground">{onChangeStatus
      ? 'Clique na tag de status para definir a situação do projeto. Os gráficos e filtros da Visão Geral são atualizados com essa classificação.'
      : 'As tags mostram a situação dos projetos definida no Acompanhamento.'}</p>
    <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        ['Com acompanhamento', linhas.filter(l => l.temAcompanhamento).length],
        ['Com visita registrada', linhas.filter(l => l.visitas > 0).length],
        ['Com mudanças', linhas.filter(l => l.temAlteracoes).length],
        ['Sem acompanhamento registrado', linhas.filter(l => !l.temAcompanhamento).length],
      ].map(([rotulo, total]) => <div key={rotulo} className="rounded-lg bg-muted/40 p-3">
        <p className="text-2xl font-semibold">{total}</p><p className="text-xs text-muted-foreground">{rotulo}</p>
      </div>)}
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar acompanhamento">
      {filtros.map(([id, label]) => <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}
        className="rounded-lg border px-3 py-2 text-xs focus-visible:outline focus-visible:outline-2"
        style={{ borderColor: 'var(--border)', background: filtro === id ? 'var(--brand-soft)' : undefined, color: filtro === id ? 'var(--brand)' : undefined }}>{label}</button>)}
    </div>
    <p className="my-3 text-xs text-muted-foreground" aria-live="polite">{visiveis.length} de {projects.length} projetos nos filtros atuais.</p>
    {visiveis.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Nenhum projeto neste filtro de acompanhamento.</p> : <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Projetos e evidências de acompanhamento</caption>
        <thead><tr className="border-b text-xs text-muted-foreground">
          {['Projeto / organização', 'Status de execução', 'Última visita', 'Pareceres', 'Mudanças', 'Última mudança'].map(t => <th key={t} scope="col" className="p-3 font-medium">{t}</th>)}
        </tr></thead>
        <tbody>{visiveis.map(l => <tr key={l.projeto.id} className="border-b last:border-0">
          <th scope="row" className="p-3 font-normal min-w-56">
            {onOpenProject ? <button type="button" onClick={() => onOpenProject(l.projeto.id)} className="text-left font-medium text-primary hover:underline">{l.projeto.code} · {l.projeto.name}</button>
              : <span className="font-medium">{l.projeto.code} · {l.projeto.name}</span>}
            <p className="mt-1 text-xs text-muted-foreground">{l.projeto.org || l.projeto.organizacao?.nome || 'Organização não informada'}</p>
          </th>
          <td className="p-3"><TagStatusProjeto status={l.projeto.status} nomeProjeto={l.projeto.name}
            aoAlterar={onChangeStatus ? status => onChangeStatus(l.projeto.id, status) : undefined} /></td>
          <td className="p-3 whitespace-nowrap">{l.ultimaVisita ? formatDateOnly(l.ultimaVisita) : 'Sem visita registrada'}</td>
          <td className="p-3">{l.pareceres}</td>
          <td className="p-3">{l.mudancas}</td>
          <td className="p-3 whitespace-nowrap">{l.ultimaMudanca ? formatDateOnly(l.ultimaMudanca) : 'Sem mudança registrada'}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
