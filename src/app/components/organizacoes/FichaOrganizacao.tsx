/**
 * Organização como hub (alteracoes-inova.pptx, 29/09/2026).
 *
 * O cabeçalho da organização (ícone, nome, Categoria · Tipo) fica fixo; o
 * conteúdo embaixo muda conforme a seção escolhida no menu lateral em árvore:
 * Dados cadastrais, Projetos (e cada projeto, inteiro, dentro da organização),
 * Encaminhamentos e notas, Registros de contato. No celular o menu lateral é
 * gaveta, então a página também mostra a troca de seção logo abaixo do título.
 */
import { useState, type ReactNode } from 'react';
import {
  ArrowLeft, Building2, ChevronRight, ExternalLink, FolderKanban, Handshake, Loader2, Trash2, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFichaOrganizacao } from './useOrganizacoes';
import { AbaRegistrosContato } from './AbaRegistrosContato';
import { AbaEncaminhamentos } from './AbaEncaminhamentos';
import { NotasDaOrganizacao } from './NotasDaOrganizacao';
import { NovoProjetoModal } from './NovoProjeto';
import { BotaoNovo } from '../BotaoNovo';
import { ProjectView } from '../ProjectView';
import { ConfirmarExclusao } from '../plano/camposFormulario';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';
import { NAO_INFORMADO, ouNaoInformado, type OrganizacaoFicha, type TipoOrganizacao } from '../../lib/organizacoes';
import { ROTA_INICIO, SECOES_ORG, type RotaOrg } from '../../lib/navegacaoOrg';

/** Ícone do cabeçalho pelo tipo de entidade (RF02.1). Sem tipo, o genérico. */
const ICONE_POR_TIPO: Record<TipoOrganizacao, typeof Building2> = {
  'Associação': Users,
  'Cooperativa': Handshake,
};

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

  const IconeTipo = org.tipo ? ICONE_POR_TIPO[org.tipo] : Building2;
  const secaoMenu = rota.secao === 'projeto' ? 'projetos' : rota.secao;
  const contagem: Partial<Record<typeof secaoMenu, number>> = {
    projetos: org.projetos.length,
    encaminhamentos: org.pendentes,
    registros: org.registros.length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho fixo da organização (slides 3 a 6). */}
      <div className="px-4 sm:px-7 pt-5 pb-3 flex flex-col gap-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
        <Voltar aoVoltar={() => aoNavegar(ROTA_INICIO)} />
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-soft)' }}
            title={org.tipo ?? 'Tipo não informado'}
          >
            <IconeTipo size={20} color="var(--brand)" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--ink-1)', lineHeight: 1.25 }}>
              {org.nome}
            </h1>
            <p style={{ color: 'var(--ink-4)', fontSize: '0.82rem', marginTop: 2 }}>
              {[org.categoria ?? 'Categoria não informada', org.tipo ?? 'Tipo não informado'].join(' · ')}
            </p>
          </div>
        </div>

        {/* No desktop a troca de seção é o menu lateral; aqui, só no celular. */}
        <div className="flex gap-1 overflow-x-auto lg:hidden -mb-1" role="tablist" aria-label="Seções da organização">
          {SECOES_ORG.map(s => {
            const ativa = s.id === secaoMenu;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={ativa}
                onClick={() => ir({ secao: s.id })}
                className="px-3 py-1.5 rounded-full whitespace-nowrap text-[12px] font-medium border"
                style={{
                  borderColor: ativa ? 'var(--brand-soft-border)' : 'var(--border)',
                  background: ativa ? 'var(--brand-soft)' : 'transparent',
                  color: ativa ? 'var(--brand)' : 'var(--ink-3)',
                }}
              >
                {s.rotulo}{contagem[s.id] ? ` (${contagem[s.id]})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {rota.secao === 'projeto' ? (
        // O projeto cuida da própria rolagem (título fixo, conteúdo rolando).
        <div className="flex-1 min-h-0">
          <ProjetoDaOrganizacao
            org={org}
            projetoId={rota.projetoId}
            aoVoltarProjetos={() => ir({ secao: 'projetos' })}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {rota.secao === 'dados' && (
            <DadosCadastrais org={org} aoAbrirProjeto={id => ir({ secao: 'projeto', projetoId: id })} />
          )}
          {rota.secao === 'projetos' && (
            <ProjetosDaOrganizacao org={org} aoAbrirProjeto={id => ir({ secao: 'projeto', projetoId: id })} />
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
  );
}

function Voltar({ aoVoltar }: { aoVoltar: () => void }) {
  return (
    <button onClick={aoVoltar} className="flex items-center gap-1 text-[12px] w-fit hover:underline" style={{ color: 'var(--ink-4)' }}>
      <ArrowLeft size={12} /> Organizações
    </button>
  );
}

// ---------------------------------------------------------------------------
// Projetos da organização: lista + "Novo projeto" (o menu Projetos saiu)
// ---------------------------------------------------------------------------

const STATUS_COR: Record<string, { cor: string; fundo: string }> = {
  'Em andamento': { cor: 'var(--brand)', fundo: 'var(--brand-soft)' },
  'Concluído': { cor: 'var(--success)', fundo: 'var(--success-soft)' },
  'Atrasado': { cor: 'var(--alert)', fundo: 'var(--alert-soft)' },
  'Não iniciado': { cor: 'var(--ink-4)', fundo: 'var(--surface-2)' },
  'Suspenso': { cor: 'var(--warning-strong-text)', fundo: 'var(--warning-soft)' },
};

const moeda = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function ProjetosDaOrganizacao({ org, aoAbrirProjeto }: { org: OrganizacaoFicha; aoAbrirProjeto: (id: number) => void }) {
  const { getProject, addProject, deleteProject } = useStore();
  const { user, readOnly } = useAuth();
  const { log: audit } = useAudit();
  const record = (action: string, detail: string, projectId?: number, projectName?: string) =>
    audit({ userLogin: user?.login ?? '—', area: 'projetos', action, detail, projectId, projectName, kind: 'alteracao' });
  const [criando, setCriando] = useState(false);
  const [excluindo, setExcluindo] = useState<{ id: number; nome: string } | null>(null);

  const confirmarExclusao = async () => {
    const alvo = excluindo;
    setExcluindo(null);
    if (!alvo) return;
    try {
      await deleteProject(alvo.id);
      record('excluir projeto', alvo.nome, alvo.id, alvo.nome);
      toast.success('Projeto excluído.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível excluir o projeto.');
    }
  };

  return (
    <div className="p-4 sm:p-7 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)' }}>
          {org.projetos.length === 0
            ? 'Nenhum projeto nesta organização.'
            : `${org.projetos.length} ${org.projetos.length === 1 ? 'projeto' : 'projetos'}`}
        </p>
        {!readOnly && <BotaoNovo onClick={() => setCriando(true)} className="self-start sm:self-auto">Novo projeto</BotaoNovo>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {org.projetos.map(resumo => {
          const p = getProject(resumo.id);
          const cor = STATUS_COR[p?.status ?? ''] ?? STATUS_COR['Não iniciado'];
          return (
            <div
              key={resumo.id}
              role="link"
              tabIndex={0}
              onClick={() => aoAbrirProjeto(resumo.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoAbrirProjeto(resumo.id); } }}
              className="bg-card rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-2 focus:outline-none focus-visible:ring-2"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>{resumo.codigo}</span>
                <span className="flex items-center gap-1">
                  {p && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ color: cor.cor, background: cor.fundo }}>
                      {p.status}
                    </span>
                  )}
                  {!readOnly && (
                    <button
                      onClick={e => { e.stopPropagation(); setExcluindo({ id: resumo.id, nome: resumo.nome }); }}
                      aria-label={`Excluir projeto ${resumo.nome}`}
                      className="p-1 rounded hover:bg-accent"
                    >
                      <Trash2 size={12} color="var(--danger)" />
                    </button>
                  )}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-1)', lineHeight: 1.35 }}>
                {resumo.nome}
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--ink-4)' }}>
                {resumo.coordenador ? `Coordenação: ${resumo.coordenador}` : <span style={{ fontStyle: 'italic' }}>Coordenação não informada</span>}
              </div>
              {p && (
                <div className="flex items-center justify-between gap-2 mt-auto pt-1" style={{ fontSize: '0.74rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{moeda(p.budgetApproved)}</span>
                  <span className="inline-flex items-center gap-1" style={{ color: 'var(--brand-text)', fontWeight: 500 }}>
                    Abrir <ChevronRight size={12} />
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {org.projetos.length === 0 && (
        <div className="bg-card rounded-xl border py-12 text-center" style={{ borderColor: 'var(--border)' }}>
          <FolderKanban size={32} color="var(--line-2)" className="mx-auto mb-2" />
          <span style={{ color: 'var(--ink-5)', fontSize: '0.82rem' }}>Esta organização ainda não tem projetos.</span>
        </div>
      )}

      {criando && (
        <NovoProjetoModal
          organizacao={org.nome}
          onClose={() => setCriando(false)}
          onCreate={async data => {
            try {
              const criado = await addProject({ ...data, comunidadeId: org.id });
              record('criar projeto', criado.name, criado.id, criado.name);
              toast.success(`Projeto "${criado.name}" criado.`);
              setCriando(false);
              aoAbrirProjeto(criado.id);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Não foi possível criar o projeto.');
            }
          }}
        />
      )}

      {excluindo && (
        <ConfirmarExclusao
          titulo={`Excluir o projeto "${excluindo.nome}"?`}
          descricao="O projeto sai do sistema com plano de trabalho, riscos, orçamento e notas. Esta ação não pode ser desfeita."
          aoCancelar={() => setExcluindo(null)}
          aoConfirmar={() => void confirmarExclusao()}
        />
      )}
    </div>
  );
}

function ProjetoDaOrganizacao({
  org, projetoId, aoVoltarProjetos,
}: { org: OrganizacaoFicha; projetoId: number | null; aoVoltarProjetos: () => void }) {
  const { getProject, projectsLoading } = useStore();
  const projeto = projetoId != null ? getProject(projetoId) : undefined;
  if (!projeto) {
    return (
      <div className="p-7" style={{ fontSize: '0.84rem', color: 'var(--ink-4)' }}>
        {projectsLoading ? 'Carregando projeto…' : `Projeto não encontrado em ${org.nome}.`}
      </div>
    );
  }
  return <ProjectView key={projeto.id} project={projeto} onBack={aoVoltarProjetos} rotuloVoltar="Projetos da organização" />;
}

// ---------------------------------------------------------------------------
// Dados cadastrais (RC-02): identificação, classificação, localização e
// pessoas de referência. Vazio aparece como "Não informado", nunca em branco.
// ---------------------------------------------------------------------------

function DadosCadastrais({ org, aoAbrirProjeto }: { org: OrganizacaoFicha; aoAbrirProjeto: (id: number) => void }) {
  const municipio = org.municipio ? `${org.municipio}${org.uf ? `/${org.uf}` : ''}` : null;
  return (
    <div className="p-4 sm:p-7 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Secao titulo="Identificação">
        <Item rotulo="Nome">{ouNaoInformado(org.nome)}</Item>
        <Item rotulo="Código interno">{ouNaoInformado(org.codigo)}</Item>
        <Item rotulo="Tipo">{ouNaoInformado(org.tipo)}</Item>
        <Item rotulo="Situação">{ouNaoInformado(org.status)}</Item>
        <Item rotulo="Projetos">
          {org.projetos.length ? (
            <ul className="flex flex-col gap-1">
              {org.projetos.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => aoAbrirProjeto(p.id)}
                    className="inline-flex items-start gap-1 text-left hover:underline"
                    style={{ color: 'var(--brand)', fontWeight: 500 }}
                  >
                    <span>{p.codigo} — {p.nome}</span>
                    <ExternalLink size={11} className="flex-shrink-0" style={{ marginTop: 3 }} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : NAO_INFORMADO}
        </Item>
      </Secao>

      <Secao titulo="Classificação">
        <Item rotulo="Categoria">{ouNaoInformado(org.categoria)}</Item>
        <Item rotulo="Eixo principal">{ouNaoInformado(org.eixo)}</Item>
      </Secao>

      <Secao titulo="Localização">
        <Item rotulo="Município">{ouNaoInformado(municipio)}</Item>
        <Item rotulo="Localidade">{ouNaoInformado(org.localizacao)}</Item>
        <Item rotulo="Território">{ouNaoInformado(org.territorio)}</Item>
      </Secao>

      <Secao titulo="Pessoas de referência">
        <Item rotulo="Responsável técnico (equipe)">{ouNaoInformado(org.responsavelTecnico)}</Item>
        {org.pessoas.length === 0 ? (
          <Item rotulo="Na organização">{NAO_INFORMADO}</Item>
        ) : org.pessoas.map(p => (
          <Item key={p.id} rotulo={p.funcao || 'Função não informada'}>
            {p.nome}{p.contato ? ` · ${p.contato}` : ''}
          </Item>
        ))}
      </Secao>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="bg-card rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <h2
        className="px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink-1)' }}
      >
        {titulo}
      </h2>
      <dl className="px-4 py-1">{children}</dl>
    </section>
  );
}

function Item({ rotulo, children }: { rotulo: string; children: string | ReactNode }) {
  const naoInformado = children === NAO_INFORMADO;
  return (
    <div className="py-2 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-3" style={{ borderBottom: '1px solid var(--line-1)' }}>
      <dt style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-5)' }}>{rotulo}</dt>
      <dd
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
