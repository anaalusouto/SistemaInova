import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DiagnosticoCompleto } from '../diagnosticos.server';
import { MATRIZ_FUNCOES } from '../diagnostic/catalog/matrizFuncional';
import { IEO_PERGUNTAS_FLAT } from '../diagnostic/catalog/ieo';
import { calcularIeo } from '../diagnostic/ieoCalculation';
import { CESTA_BLOCOS } from '../diagnostic/catalog/cestaProdutos';
import { PARECER_GRUPOS } from '../diagnostic/catalog/parecerComplementar';

export type ReportComponente = 'identificacao' | 'matriz' | 'ieo' | 'cesta' | 'parecer';

export interface ReportMatrizFuncao {
  funcao: string;
  atuacao: string;
  quemExecuta: string;
  interesse: string;
  criticidade: string;
  abrangencia: string;
  observacoes: string;
}

export interface ReportIeoPergunta {
  dimensao: string;
  pergunta: string;
  nivel: number;
  descricaoNivel: string;
  observacao: string;
}

export interface ReportIeoModel {
  geral: number | null;
  porDimensao: { dimensao: string; media: number | null }[];
  perguntas: ReportIeoPergunta[];
}

export interface ReportProdutoModel {
  nome: string;
  cadeia: string;
  campos: { bloco: string; label: string; valor: string }[];
}

export interface ReportParecerModel {
  complementares: { grupo: string; label: string; valor: string }[];
  sintese: string;
  capacidades: string;
  fragilidades: string;
  pontosPrioritarios: string;
  consideracoesTecnicas: string;
  evidencias: string[];
}

export interface DiagnosticoReportEntry {
  organizacao: string;
  code: string;
  classificacao: string;
  dataAplicacao: string;
  versao: number;
  matriz?: ReportMatrizFuncao[];
  ieo?: ReportIeoModel;
  produtos?: ReportProdutoModel[];
  parecer?: ReportParecerModel;
}

export interface DiagnosticoReportModel {
  title: string;
  generatedAt: Date;
  entries: DiagnosticoReportEntry[];
}

const fmtDateOnly = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
};

const fmtDateTime = (d: Date) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(d);

const DIACRITICS_RE = /[̀-ͯ]/g;
function slugify(s: string): string {
  return (
    s.normalize('NFD').replace(DIACRITICS_RE, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
    'relatorio'
  );
}

function valorLegivel(v: string | string[] | number | null | undefined): string {
  if (v == null) return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  return String(v).trim() || '—';
}

/** Monta o modelo de relatório a partir dos dados crus + catálogos (resolve rótulos legíveis). */
export function buildDiagnosticoReportModel(
  title: string,
  dados: DiagnosticoCompleto[],
  componentes: ReportComponente[],
): DiagnosticoReportModel {
  const has = (c: ReportComponente) => componentes.includes(c);

  const entries: DiagnosticoReportEntry[] = dados.map(d => {
    const entry: DiagnosticoReportEntry = {
      organizacao: d.comunidade.nome, code: d.comunidade.code, classificacao: d.comunidade.classificacao,
      dataAplicacao: fmtDateOnly(d.diagnostico.dataAplicacao), versao: d.diagnostico.versao,
    };

    if (has('matriz')) {
      const respostaPorFuncao = new Map(d.matriz.map(r => [r.funcaoId, r]));
      entry.matriz = MATRIZ_FUNCOES.filter(f => respostaPorFuncao.has(f.id)).map(f => {
        const r = respostaPorFuncao.get(f.id)!;
        return {
          funcao: f.funcao, atuacao: valorLegivel(r.atuacao), quemExecuta: valorLegivel(r.quemExecuta),
          interesse: valorLegivel(r.interesse), criticidade: valorLegivel(r.criticidade),
          abrangencia: valorLegivel(r.abrangencia), observacoes: valorLegivel(r.observacoes),
        };
      });
    }

    if (has('ieo')) {
      const resultado = calcularIeo(d.ieo.map(r => ({ perguntaId: r.perguntaId, nivel: r.nivel })));
      const respostaPorPergunta = new Map(d.ieo.map(r => [r.perguntaId, r]));
      const perguntas: ReportIeoPergunta[] = IEO_PERGUNTAS_FLAT
        .filter(p => respostaPorPergunta.has(p.pergunta.id))
        .map(p => {
          const r = respostaPorPergunta.get(p.pergunta.id)!;
          const nivel = p.pergunta.niveis.find(n => n.valor === String(r.nivel));
          return {
            dimensao: p.dimensaoTitulo, pergunta: p.pergunta.texto, nivel: r.nivel,
            descricaoNivel: nivel?.descricao ?? '', observacao: valorLegivel(r.observacao),
          };
        });
      entry.ieo = { geral: resultado.geral, porDimensao: resultado.porDimensao.map(r => ({ dimensao: r.dimensaoTitulo, media: r.media })), perguntas };
    }

    if (has('cesta')) {
      entry.produtos = d.produtos.map(produto => {
        const campos: { bloco: string; label: string; valor: string }[] = [];
        for (const bloco of CESTA_BLOCOS) {
          for (const campo of bloco.campos) {
            const valor = produto.respostas[campo.id];
            if (valor == null || (Array.isArray(valor) && valor.length === 0) || valor === '') continue;
            const outro = produto.respostas[campo.id + '__outro'];
            campos.push({ bloco: bloco.titulo, label: campo.label, valor: valorLegivel(valor) + (outro ? ` (${outro})` : '') });
          }
        }
        return { nome: produto.nome, cadeia: produto.cadeia ?? '—', campos };
      });
    }

    if (has('parecer')) {
      const complementares: { grupo: string; label: string; valor: string }[] = [];
      for (const grupo of PARECER_GRUPOS) {
        for (const campo of grupo.campos) {
          const valor = d.parecer.respostasComplementares[campo.id];
          if (valor == null || (Array.isArray(valor) && valor.length === 0) || valor === '') continue;
          const outro = d.parecer.respostasComplementares[campo.id + '__outro'];
          complementares.push({ grupo: grupo.titulo, label: campo.label, valor: valorLegivel(valor) + (outro ? ` (${outro})` : '') });
        }
      }
      entry.parecer = {
        complementares,
        sintese: valorLegivel(d.parecer.sintese), capacidades: valorLegivel(d.parecer.capacidades),
        fragilidades: valorLegivel(d.parecer.fragilidades), pontosPrioritarios: valorLegivel(d.parecer.pontosPrioritarios),
        consideracoesTecnicas: valorLegivel(d.parecer.consideracoesTecnicas),
        evidencias: d.parecer.evidenciasVinculadas.map(e => `${e.tipo} — ${e.referencia}${e.nota ? ` (${e.nota})` : ''}`),
      };
    }

    return entry;
  });

  return { title, generatedAt: new Date(), entries };
}

/** Gera um PDF vetorial com o conteúdo completo do relatório de diagnóstico(s). */
export function exportDiagnosticoReportPdf(model: DiagnosticoReportModel) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 50;

  const ensureSpace = (needed: number) => {
    if (y > pageHeight - needed) { doc.addPage(); y = 50; }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(model.title, marginX, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Gerado em ${fmtDateTime(model.generatedAt)} · ${model.entries.length} diagnóstico(s)`, marginX, y);
  doc.setTextColor(0);
  y += 20;

  for (const entry of model.entries) {
    ensureSpace(120);
    doc.setFillColor(30, 64, 175);
    doc.rect(marginX, y, pageWidth - marginX * 2, 26, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${entry.organizacao} (${entry.code})`, marginX + 8, y + 17);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Aplicação: ${entry.dataAplicacao} · v${entry.versao}`, pageWidth - marginX - 8, y + 17, { align: 'right' });
    doc.setTextColor(0);
    y += 36;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Classificação: ${entry.classificacao || '—'}`, marginX, y);
    y += 16;

    if (entry.matriz) {
      ensureSpace(80);
      autoTable(doc, {
        startY: y,
        head: [['Função', 'Atuação', 'Quem executa', 'Interesse', 'Criticidade', 'Abrangência', 'Observações']],
        body: entry.matriz.map(m => [m.funcao, m.atuacao, m.quemExecuta, m.interesse, m.criticidade, m.abrangencia, m.observacoes]),
        theme: 'grid', styles: { fontSize: 7, cellPadding: 3 }, headStyles: { fillColor: [37, 99, 235] },
        margin: { left: marginX, right: marginX },
      });
      y = (doc as any).lastAutoTable.finalY + 16;
    }

    if (entry.ieo) {
      ensureSpace(80);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('IEO', marginX, y); y += 4;
      autoTable(doc, {
        startY: y + 6,
        head: [['Dimensão', 'Média']],
        body: [...entry.ieo.porDimensao.map(d => [d.dimensao, d.media?.toFixed(1) ?? '—']), ['Geral', entry.ieo.geral?.toFixed(1) ?? '—']],
        theme: 'grid', styles: { fontSize: 8 }, headStyles: { fillColor: [37, 99, 235] },
        margin: { left: marginX, right: marginX },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
      if (entry.ieo.perguntas.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Dimensão', 'Pergunta', 'Nível', 'Descrição do nível']],
          body: entry.ieo.perguntas.map(p => [p.dimensao, p.pergunta, String(p.nivel), p.descricaoNivel]),
          theme: 'striped', styles: { fontSize: 7, cellPadding: 3 }, headStyles: { fillColor: [37, 99, 235] },
          margin: { left: marginX, right: marginX },
        });
        y = (doc as any).lastAutoTable.finalY + 16;
      }
    }

    if (entry.produtos) {
      for (const produto of entry.produtos) {
        ensureSpace(80);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        doc.text(`Cesta de Produtos — ${produto.nome} (${produto.cadeia})`, marginX, y);
        y += 10;
        if (produto.campos.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [['Bloco', 'Campo', 'Resposta']],
            body: produto.campos.map(c => [c.bloco, c.label, c.valor]),
            theme: 'striped', styles: { fontSize: 7, cellPadding: 3 }, headStyles: { fillColor: [37, 99, 235] },
            margin: { left: marginX, right: marginX },
          });
          y = (doc as any).lastAutoTable.finalY + 14;
        }
      }
    }

    if (entry.parecer) {
      ensureSpace(80);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('Parecer Técnico', marginX, y); y += 10;
      if (entry.parecer.complementares.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Dimensão', 'Pergunta', 'Resposta']],
          body: entry.parecer.complementares.map(c => [c.grupo, c.label, c.valor]),
          theme: 'striped', styles: { fontSize: 7, cellPadding: 3 }, headStyles: { fillColor: [37, 99, 235] },
          margin: { left: marginX, right: marginX },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
      ensureSpace(120);
      autoTable(doc, {
        startY: y,
        body: [
          ['Síntese', entry.parecer.sintese], ['Capacidades', entry.parecer.capacidades],
          ['Fragilidades', entry.parecer.fragilidades], ['Pontos prioritários', entry.parecer.pontosPrioritarios],
          ['Considerações técnicas', entry.parecer.consideracoesTecnicas],
          ...(entry.parecer.evidencias.length ? [['Evidências vinculadas', entry.parecer.evidencias.join('; ')]] : []),
        ],
        theme: 'plain', styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 130, textColor: 90 }, 1: { textColor: 30 } },
        margin: { left: marginX, right: marginX },
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    } else {
      y += 10;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginX, pageHeight - 20, { align: 'right' });
  }

  doc.save(`${slugify(model.title)}.pdf`);
}
