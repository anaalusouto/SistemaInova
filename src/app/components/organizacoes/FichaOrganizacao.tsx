/**
 * Organização como hub (alteracoes-inova.pptx, 29/09/2026).
 *
 * Somente o H1 com o nome da organização fica fixo; os metadados e o
 * conteúdo embaixo muda conforme a seção escolhida no menu lateral em árvore:
 * Dados cadastrais, Projeto (único, dentro da organização),
 * Encaminhamentos e notas, Registros de contato. No celular o menu lateral é
 * gaveta, então a página também mostra a troca de seção logo abaixo do título.
 */
import { type ReactNode } from 'react';
import {
  ArrowLeft, ExternalLink, Loader2, ChevronDown,
} from 'lucide-react';

import { useFichaOrganizacao } from './useOrganizacoes';
import { AbaRegistrosContato } from './AbaRegistrosContato';
import { AbaEncaminhamentos } from './AbaEncaminhamentos';
import { NotasDaOrganizacao } from './NotasDaOrganizacao';
import { DiagnosticoModule } from '../DiagnosticoModule';
import { DocumentosRegistro } from '../DocumentosRegistro';
import { ProjectView } from '../ProjectView';
import { TituloNavegacao } from '../TituloNavegacao';
import { useStore } from '../../store';
import { NAO_INFORMADO, ouNaoInformado, type OrganizacaoFicha } from '../../lib/organizacoes';
import { ROTA_INICIO, SECOES_ORG, resolverProjetoOrg, type RotaOrg } from '../../lib/navegacaoOrg';
import type { AbaProjeto } from '../../lib/navegacaoApp';

interface FichaOrganizacaoProps {
  rota: RotaOrg & { orgId: string };
  aoNavegar: (rota: RotaOrg) => void;
}

export function FichaOrganizacao({ rota, aoNavegar }: FichaOrganizacaoProps) {
  const { data: org, isLoading, error } = useFichaOrganizacao(rota.orgId);
  const ir = (parcial: Partial<RotaOrg>) => aoNavegar({ ...rota, projetoId: null, foco: null, ...parcial });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={22} className="animate-spin" color="var(--ink-5)" />
      </div>
    );
  }
  if (error || !org) {
    return (
      <div className="p-7 flex flex-col gap-3">
        <Voltar aoVoltar={() => aoNavegar(ROTA_INICIO)} />
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
          Não foi possível abrir a organização. {(error as Error | null)?.message}
        </p>
      </div>
    );
  }

  const secaoMenu = rota.secao === 'projeto' ? 'projetos' : rota.secao;
  const vinculoAtual = resolverProjetoOrg(org.projetos, rota.projetoId);
  const tituloAtual = secaoMenu === 'projetos' && vinculoAtual.estado === 'unico'
    ? vinculoAtual.projeto.nome : org.nome;
  const contagem: Partial<Record<typeof secaoMenu, number>> = {
    encaminhamentos: org.pendentes,
    registros: org.registros.length,
  };

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
      <div className="shrink-0"><TituloNavegacao nome={tituloAtual} aoVoltar={() => aoNavegar(ROTA_INICIO)} /></div>
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">
      <div className="lg:hidden px-4 sm:px-7 pt-5 pb-3 flex flex-col gap-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>


        {/* No desktop a troca de seção é o menu lateral; aqui, só no celular. */}
        <label className="flex min-w-0 flex-col gap-1 lg:hidden text-xs text-muted-foreground">
          Seção da organização
          <select aria-label="Seção da organização" value={secaoMenu} onChange={e => ir({secao:e.target.value as typeof secaoMenu})} className="w-full min-w-0 min-h-11 rounded-lg border bg-card px-3 text-sm text-foreground">
          {SECOES_ORG.map(s => {
            return (
              <option key={s.id} value={s.id}>
                {s.rotulo}{s.emConstrucao ? ' (Em construção)' : ''}{contagem[s.id] ? ` (${contagem[s.id]})` : ''}
              </option>
            );
          })}
          </select>
        </label>
      </div>

      {rota.secao === 'projeto' || rota.secao === 'projetos' ? (
        <div className="min-w-0">
          <ProjetoDaOrganizacao
            org={org}
            projetoId={rota.projetoId}
            aoVoltarProjetos={() => ir({ secao: 'dados' })}
            abaAtual={rota.abaProjeto ?? 'plano'}
            focoAtual={rota.foco ?? null}
            aoMudarAba={(abaProjeto, foco) => ir({ secao: 'projeto', projetoId: rota.projetoId, abaProjeto, foco: foco ?? null })}
          />
        </div>
      ) : (
        <div className="min-w-0">
          {(rota.secao === 'mapeamento' || rota.secao === 'parecer') && (
            <section key={`${org.id}-${rota.secao}`}>
              <DiagnosticoModule comunidadeId={org.id} instrumentoInicial={rota.secao === 'parecer' ? 'parecer' : 'matriz'} />
              <div className="px-4 sm:px-7 pb-7"><DocumentosRegistro area={rota.secao} organizacaoId={org.id} relatorioUrl={rota.secao === 'parecer' ? org.parecerRelatorioUrl : org.mapeamentoRelatorioUrl} /></div>
            </section>
          )}
          {rota.secao === 'dados' && (
            <DadosCadastrais org={org} aoAbrirProjeto={id => ir({ secao: 'projeto', projetoId: id })} />
          )}
          {rota.secao === 'encaminhamentos' && (
            // Slide 5: encaminhamentos à esquerda, post-its à direita.
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
              <AbaEncaminhamentos
                org={org}
                foco={rota.foco ?? null}
                aoVerRegistro={id => ir({ secao: 'registros', foco: id })}
              />
              <div className="px-4 sm:px-7 xl:pl-0 pb-7 xl:pt-7">
                <div className="bg-card rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                  <NotasDaOrganizacao org={org} />
                </div>
              </div>
            </div>
          )}
          {rota.secao === 'registros' && (
            <AbaRegistrosContato
              org={org}
              foco={rota.foco ?? null}
              aoVerEncaminhamentos={id => ir({ secao: 'encaminhamentos', foco: id })}
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function Voltar({ aoVoltar, atual }: { aoVoltar: () => void; atual?: string }) {
  return (
    <nav aria-label="Caminho de navegação" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <button type="button" onClick={aoVoltar} className="flex shrink-0 items-center gap-1 hover:underline" style={{ color: 'var(--ink-4)' }}>
        <ArrowLeft size={12} aria-hidden /> Organizações
      </button>
      {atual && <><span aria-hidden>/</span><span aria-current="page" className="min-w-0 break-words [overflow-wrap:anywhere]">{atual}</span></>}
    </nav>
  );
}

function ProjetoDaOrganizacao({
  org, projetoId, aoVoltarProjetos, abaAtual, focoAtual, aoMudarAba,
}: { org: OrganizacaoFicha; projetoId: number | null; aoVoltarProjetos: () => void;
  abaAtual: AbaProjeto; focoAtual: string | null; aoMudarAba: (aba: AbaProjeto, foco?: string | null) => void }) {
  const { getProject, projectsLoading } = useStore();
  const vinculo = resolverProjetoOrg(org.projetos, projetoId);
  if (vinculo.estado !== 'unico') {
    return (
      <div className="p-7 text-sm" role={vinculo.estado === 'sem-projeto' ? 'status' : 'alert'}>
        {vinculo.estado === 'sem-projeto'
          ? `Nenhum projeto vinculado a ${org.nome} (ID: ${org.id}). O vínculo precisa ser tratado pela equipe responsável.`
          : `Vínculo de projeto ${vinculo.estado === 'conflito' ? 'em conflito' : 'inválido'} para ${org.nome} (ID: ${org.id}). Projetos vinculados: ${vinculo.ids.join(', ')}. Solicite a correção dos vínculos.`}
      </div>
    );
  }
  const projeto = getProject(vinculo.projeto.id);
  if (!projeto) {
    return (
      <div className="p-7" style={{ fontSize: '0.84rem', color: 'var(--ink-4)' }}>
        {projectsLoading ? 'Carregando projeto…' : `Não foi possível carregar o projeto ${vinculo.projeto.id} vinculado a ${org.nome}. Recarregue a página ou informe a falha à equipe responsável.`}
      </div>
    );
  }
  return <ProjectView key={projeto.id} project={projeto} onBack={aoVoltarProjetos} rotuloVoltar="Dados da organização" dentroDaOrganizacao
    abaAtual={abaAtual} focoAtual={focoAtual} aoMudarAba={aoMudarAba} />;
}

// ---------------------------------------------------------------------------
// Dados cadastrais (RC-02): identificação, classificação, localização e
// pessoas de referência. Vazio aparece como "Não informado", nunca em branco.
// ---------------------------------------------------------------------------

export function DadosCadastrais({ org, aoAbrirProjeto }: { org: OrganizacaoFicha; aoAbrirProjeto: (id: number) => void }) {
  const municipio = org.municipio ? `${org.municipio}${org.uf ? `/${org.uf}` : ''}` : null;
  const vinculo = resolverProjetoOrg(org.projetos);
  const projeto = vinculo.estado === 'unico' ? vinculo.projeto : null;
  return <div className="p-4 sm:p-7 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
    <Secao titulo="Identificação da organização">
      <Item rotulo="Nome">{ouNaoInformado(org.nome)}</Item>
      <Item rotulo="Código interno">{ouNaoInformado(org.codigo)}</Item>
      <Item rotulo="Tipo">{ouNaoInformado(org.tipo)}</Item>
      <Item rotulo="Situação">{ouNaoInformado(org.status)}</Item>
      <Item rotulo="Categoria">{ouNaoInformado(org.categoria)}</Item>
      <Item rotulo="Eixo principal">{ouNaoInformado(org.eixo)}</Item>
    </Secao>
    <Secao titulo="Pessoas de referência">
      <Item rotulo="Responsável técnico (equipe)">{ouNaoInformado(org.responsavelTecnico)}</Item>
      {org.pessoas.length === 0 ? <Item rotulo="Na organização">{NAO_INFORMADO}</Item> : org.pessoas.map(p =>
        <Item key={p.id} rotulo={p.funcao || 'Função não informada'}>{p.nome}{p.contato ? ` · ${p.contato}` : ''}</Item>)}
    </Secao>
    <Secao titulo="Localização">
      <Item rotulo="Município">{ouNaoInformado(municipio)}</Item>
      <Item rotulo="Localidade">{ouNaoInformado(org.localizacao)}</Item>
      <Item rotulo="Território">{ouNaoInformado(org.territorio)}</Item>
    </Secao>
    <Secao titulo="Projetos vinculados">
      <Item rotulo="Projeto">{projeto ?
        <button type="button" onClick={() => aoAbrirProjeto(projeto.id)} className="inline-flex items-start gap-1 text-left hover:underline" style={{color:'var(--brand)',fontWeight:500}}>
          <span>{projeto.codigo} — {projeto.nome}</span><ExternalLink size={11} className="shrink-0 mt-1" aria-hidden />
        </button> : vinculo.estado === 'conflito' ? `Conflito de vínculos. IDs dos projetos: ${vinculo.ids.join(', ')}. Solicite correção.` : 'Sem projeto vinculado'}</Item>
    </Secao>
  </div>;
}
function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details open className="project-disclosure min-w-0 bg-card rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <summary
        className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink-1)' }}
      >
        <h2>{titulo}</h2><ChevronDown size={16} aria-hidden className="shrink-0" />
      </summary>
      <dl className="px-4 py-1">{children}</dl>
    </details>
  );
}

function Item({ rotulo, children }: { rotulo: string; children: string | ReactNode }) {
  const naoInformado = children === NAO_INFORMADO;
  return (
    <div className="py-2 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-3" style={{ borderBottom: '1px solid var(--line-1)' }}>
      <dt style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-5)' }}>{rotulo}</dt>
      <dd
        className="min-w-0 [overflow-wrap:anywhere]"
        style={{
          fontSize: '0.82rem', whiteSpace: 'pre-line',
          color: naoInformado ? 'var(--ink-5)' : 'var(--ink-1)',
          fontStyle: naoInformado ? 'italic' : undefined,
        }}
      >
        {children}
      </dd>
    </div>
  );
}
