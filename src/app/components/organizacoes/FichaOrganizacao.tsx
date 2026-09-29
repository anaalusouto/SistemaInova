/**
 * Ficha da Organização (RC-02): Dados cadastrais, Registros de contato e
 * Encaminhamentos.
 */
import { useState, type ReactNode } from 'react';
import { ArrowLeft, Building2, ExternalLink, FileText, Handshake, Loader2, MessageSquare, ListChecks, Users } from 'lucide-react';
import { useFichaOrganizacao } from './useOrganizacoes';
import { AbaRegistrosContato } from './AbaRegistrosContato';
import { AbaEncaminhamentos } from './AbaEncaminhamentos';
import { BotaoNotasEChecklist } from './NotasEChecklist';
import { NAO_INFORMADO, ouNaoInformado, type OrganizacaoFicha, type TipoOrganizacao } from '../../lib/organizacoes';

type Aba = 'dados' | 'contatos' | 'encaminhamentos';

/** Ícone do cabeçalho pelo tipo de entidade (RF02.1). Sem tipo, o genérico. */
const ICONE_POR_TIPO: Record<TipoOrganizacao, typeof Building2> = {
  'Associação': Users,
  'Cooperativa': Handshake,
};

interface FichaOrganizacaoProps {
  organizacaoId: string;
  aoVoltar: () => void;
  aoAbrirProjeto: (id: number) => void;
}

export function FichaOrganizacao({ organizacaoId, aoVoltar, aoAbrirProjeto }: FichaOrganizacaoProps) {
  const { data: org, isLoading, error } = useFichaOrganizacao(organizacaoId);
  const [aba, setAba] = useState<Aba>('dados');
  // Navegação cruzada registro ⇄ encaminhamento (UI/UX): o id do registro de
  // contato em foco. Nos Registros, destaca o cartão; nos Encaminhamentos,
  // destaca os que nasceram dele.
  const [foco, setFoco] = useState<string | null>(null);
  const irPara = (destino: Aba, registroId: string) => { setFoco(registroId); setAba(destino); };

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
        <Voltar aoVoltar={aoVoltar} />
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
          Não foi possível abrir a organização. {(error as Error | null)?.message}
        </p>
      </div>
    );
  }

  const IconeTipo = org.tipo ? ICONE_POR_TIPO[org.tipo] : Building2;
  const abas: { id: Aba; rotulo: string; icone: typeof FileText; contagem?: number }[] = [
    { id: 'dados', rotulo: 'Dados cadastrais', icone: FileText },
    { id: 'contatos', rotulo: 'Registros de contato', icone: MessageSquare, contagem: org.registros.length },
    { id: 'encaminhamentos', rotulo: 'Encaminhamentos', icone: ListChecks, contagem: org.pendentes },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-7 pt-5 flex flex-col gap-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <Voltar aoVoltar={aoVoltar} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--brand-soft)' }}
              title={org.tipo ?? 'Tipo não informado'}
            >
              <IconeTipo size={18} color="var(--brand)" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--ink-1)' }}>
                {org.nome}
              </h1>
              <p style={{ color: 'var(--ink-4)', fontSize: '0.8rem', marginTop: 2 }}>
                {[org.categoria ?? 'Categoria não informada', org.tipo ?? 'Tipo não informado'].join(' · ')}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 self-start sm:self-auto">
            <BotaoNotasEChecklist organizacaoId={org.id} aoVerTodos={() => setAba('encaminhamentos')} />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto -mb-px" role="tablist">
          {abas.map(a => {
            const Icone = a.icone;
            const ativa = a.id === aba;
            return (
              <button
                key={a.id}
                role="tab"
                aria-selected={ativa}
                onClick={() => setAba(a.id)}
                className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: ativa ? 600 : 500,
                  color: ativa ? 'var(--primary)' : 'var(--ink-4)',
                  borderBottom: `2px solid ${ativa ? 'var(--primary)' : 'transparent'}`,
                }}
              >
                <Icone size={13} />
                {a.rotulo}
                {!!a.contagem && (
                  <span
                    className="px-1.5 rounded-full"
                    style={{ fontSize: '0.66rem', background: 'var(--surface-2)', color: 'var(--ink-3)' }}
                  >
                    {a.contagem}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {aba === 'dados' && <DadosCadastrais org={org} aoAbrirProjeto={aoAbrirProjeto} />}
        {aba === 'contatos' && (
          <AbaRegistrosContato org={org} foco={foco} aoVerEncaminhamentos={id => irPara('encaminhamentos', id)} />
        )}
        {aba === 'encaminhamentos' && (
          <AbaEncaminhamentos org={org} foco={foco} aoVerRegistro={id => irPara('contatos', id)} />
        )}
      </div>
    </div>
  );
}

function Voltar({ aoVoltar }: { aoVoltar: () => void }) {
  return (
    <button onClick={aoVoltar} className="flex items-center gap-1 text-[12px] w-fit hover:text-blue-600" style={{ color: 'var(--ink-4)' }}>
      <ArrowLeft size={12} /> Organizações
    </button>
  );
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
