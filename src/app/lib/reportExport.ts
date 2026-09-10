import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project } from '../data/mockData';

export interface ReportProjectModel {
  name: string;
  code: string;
  cadastro?: { coordinator: string; financier: string; vigencia: string };
  situacao?: { status: string; progress: number };
  objetivo?: string;
  equipe?: string[];
  financeiro?: { aprovado: number; executado: number; saldo: number };
  metas?: { name: string; done: number; total: number }[];
  contrapartidas?: number;
  riscos?: number;
  mudancas?: number;
  evidencias?: number;
}

export interface ReportModel {
  title: string;
  generatedAt: Date;
  totals?: { budget: number; executed: number; balance: number };
  projects: ReportProjectModel[];
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

const fmtDateTime = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(d);

// Faixa Unicode dos acentos combinantes (U+0300–U+036F), usada para "achatar" acentos após normalize('NFD').
const DIACRITICS_RE = /[̀-ͯ]/g;

function slugify(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(DIACRITICS_RE, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'relatorio'
  );
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Monta o modelo intermediário do relatório a partir dos projetos e campos selecionados. */
export function buildReportModel(title: string, projects: Project[], fields: string[]): ReportModel {
  const has = (f: string) => fields.includes(f);
  const model: ReportModel = { title, generatedAt: new Date(), projects: [] };

  if (has('financeiro')) {
    const budget = projects.reduce((a, p) => a + p.budgetApproved, 0);
    const executed = projects.reduce((a, p) => a + p.budgetExecuted, 0);
    model.totals = { budget, executed, balance: budget - executed };
  }

  model.projects = projects.map(p => {
    const pm: ReportProjectModel = { name: p.name, code: p.code };

    if (has('cadastro')) {
      pm.cadastro = { coordinator: p.coordinator, financier: p.financier, vigencia: `${p.startDate} → ${p.endDate}` };
    }
    if (has('situacao')) pm.situacao = { status: p.status, progress: p.progress };
    if (has('objetivo')) pm.objetivo = p.objective;
    if (has('equipe') && p.team.length > 0) pm.equipe = p.team;
    if (has('financeiro')) {
      pm.financeiro = { aprovado: p.budgetApproved, executado: p.budgetExecuted, saldo: p.budgetApproved - p.budgetExecuted };
    }
    if (has('metas') && p.goals.length > 0) {
      pm.metas = p.goals.map(g => {
        const acts = g.deliverables.flatMap(d => d.activities);
        const done = acts.filter(a => a.status === 'Concluído').length;
        return { name: g.name, done, total: acts.length };
      });
    }
    if (has('contrapart')) pm.contrapartidas = (p.contrapartidas ?? []).length;
    if (has('riscos')) pm.riscos = p.risks.length;
    if (has('mudancas')) pm.mudancas = p.changes.length;
    if (has('evidencias')) pm.evidencias = p.evidences.length;

    return pm;
  });

  return model;
}

function csvEscape(v: string | number): string {
  return `"${String(v).replace(/"/g, '""')}"`;
}

export function exportReportCsv(model: ReportModel) {
  const rows: (string | number)[][] = [['Seção', 'Projeto', 'Campo', 'Valor']];
  rows.push(['Relatório', '', 'Título', model.title]);
  rows.push(['Relatório', '', 'Gerado em', fmtDateTime(model.generatedAt)]);
  rows.push(['Relatório', '', 'Projetos incluídos', model.projects.length]);

  if (model.totals) {
    rows.push(['Financeiro Consolidado', '', 'Aprovado', model.totals.budget]);
    rows.push(['Financeiro Consolidado', '', 'Executado', model.totals.executed]);
    rows.push(['Financeiro Consolidado', '', 'Saldo', model.totals.balance]);
  }

  for (const p of model.projects) {
    if (p.cadastro) {
      rows.push(['Cadastro', p.name, 'Coordenador(a)', p.cadastro.coordinator]);
      rows.push(['Cadastro', p.name, 'Financiador', p.cadastro.financier]);
      rows.push(['Cadastro', p.name, 'Vigência', p.cadastro.vigencia]);
    }
    if (p.situacao) {
      rows.push(['Situação', p.name, 'Status', p.situacao.status]);
      rows.push(['Situação', p.name, 'Progresso (%)', p.situacao.progress]);
    }
    if (p.objetivo) rows.push(['Objetivo', p.name, 'Objetivo', p.objetivo]);
    if (p.equipe) rows.push(['Equipe', p.name, 'Membros', p.equipe.join(', ')]);
    if (p.financeiro) {
      rows.push(['Financeiro', p.name, 'Aprovado', p.financeiro.aprovado]);
      rows.push(['Financeiro', p.name, 'Executado', p.financeiro.executado]);
      rows.push(['Financeiro', p.name, 'Saldo', p.financeiro.saldo]);
    }
    if (p.metas) {
      for (const m of p.metas) rows.push(['Metas', p.name, m.name, `${m.done}/${m.total} atividades concluídas`]);
    }
    if (p.contrapartidas !== undefined) rows.push(['Contrapartidas', p.name, 'Itens', p.contrapartidas]);
    if (p.riscos !== undefined) rows.push(['Riscos', p.name, 'Riscos abertos', p.riscos]);
    if (p.mudancas !== undefined) rows.push(['Mudanças', p.name, 'Mudanças', p.mudancas]);
    if (p.evidencias !== undefined) rows.push(['Evidências', p.name, 'Anexos', p.evidencias]);
  }

  const csv = rows.map(r => r.map(csvEscape).join(';')).join('\n');
  // BOM garante acentuação correta ao abrir no Excel.
  downloadFile(`${slugify(model.title)}.csv`, '﻿' + csv, 'text/csv;charset=utf-8;');
}

function xmlEscape(v: string | number): string {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportReportXml(model: ReportModel) {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<relatorio titulo="${xmlEscape(model.title)}" geradoEm="${xmlEscape(fmtDateTime(model.generatedAt))}">`);

  if (model.totals) {
    lines.push(
      `  <totais aprovado="${model.totals.budget}" executado="${model.totals.executed}" saldo="${model.totals.balance}"/>`
    );
  }

  lines.push('  <projetos>');
  for (const p of model.projects) {
    lines.push(`    <projeto nome="${xmlEscape(p.name)}" codigo="${xmlEscape(p.code)}">`);
    if (p.cadastro) {
      lines.push(
        `      <cadastro coordenador="${xmlEscape(p.cadastro.coordinator)}" financiador="${xmlEscape(p.cadastro.financier)}" vigencia="${xmlEscape(p.cadastro.vigencia)}"/>`
      );
    }
    if (p.situacao) lines.push(`      <situacao status="${xmlEscape(p.situacao.status)}" progresso="${p.situacao.progress}"/>`);
    if (p.objetivo) lines.push(`      <objetivo>${xmlEscape(p.objetivo)}</objetivo>`);
    if (p.equipe) lines.push(`      <equipe>${p.equipe.map(m => `<membro>${xmlEscape(m)}</membro>`).join('')}</equipe>`);
    if (p.financeiro) {
      lines.push(
        `      <financeiro aprovado="${p.financeiro.aprovado}" executado="${p.financeiro.executado}" saldo="${p.financeiro.saldo}"/>`
      );
    }
    if (p.metas) {
      lines.push('      <metas>');
      for (const m of p.metas) lines.push(`        <meta nome="${xmlEscape(m.name)}" concluidas="${m.done}" total="${m.total}"/>`);
      lines.push('      </metas>');
    }
    if (p.contrapartidas !== undefined) lines.push(`      <contrapartidas total="${p.contrapartidas}"/>`);
    if (p.riscos !== undefined) lines.push(`      <riscos total="${p.riscos}"/>`);
    if (p.mudancas !== undefined) lines.push(`      <mudancas total="${p.mudancas}"/>`);
    if (p.evidencias !== undefined) lines.push(`      <evidencias total="${p.evidencias}"/>`);
    lines.push('    </projeto>');
  }
  lines.push('  </projetos>');
  lines.push('</relatorio>');

  downloadFile(`${slugify(model.title)}.xml`, lines.join('\n'), 'application/xml;charset=utf-8;');
}

/** Gera um PDF vetorial (não é uma captura de tela) com o conteúdo completo do relatório. */
export function exportReportPdf(model: ReportModel) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(model.title, marginX, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Gerado em ${fmtDateTime(model.generatedAt)} · ${model.projects.length} projeto(s)`, marginX, y);
  doc.setTextColor(0);
  y += 18;

  if (model.totals) {
    autoTable(doc, {
      startY: y,
      head: [['Resumo Financeiro Consolidado', '']],
      body: [
        ['Aprovado', fmtCurrency(model.totals.budget)],
        ['Executado', fmtCurrency(model.totals.executed)],
        ['Saldo', fmtCurrency(model.totals.balance)],
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 64, 175] },
      margin: { left: marginX, right: marginX },
    });
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  for (const p of model.projects) {
    if (y > pageHeight - 100) {
      doc.addPage();
      y = 50;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(p.name, marginX, y, { maxWidth: pageWidth - marginX * 2 - 80 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(p.code, pageWidth - marginX, y, { align: 'right' });
    doc.setTextColor(0);
    y += 12;

    const rows: [string, string][] = [];
    if (p.cadastro) {
      rows.push(['Coordenador(a)', p.cadastro.coordinator]);
      rows.push(['Financiador', p.cadastro.financier]);
      // As fontes padrão do PDF (WinAnsi) não têm glifo para "→"; troca por "–" só na renderização do PDF.
      rows.push(['Vigência', p.cadastro.vigencia.replace(/→/g, '–')]);
    }
    if (p.situacao) {
      rows.push(['Situação', p.situacao.status]);
      rows.push(['Progresso', `${p.situacao.progress}%`]);
    }
    if (p.objetivo) rows.push(['Objetivo', p.objetivo]);
    if (p.equipe) rows.push(['Equipe', p.equipe.join(', ')]);
    if (p.financeiro) {
      rows.push(['Aprovado', fmtCurrency(p.financeiro.aprovado)]);
      rows.push(['Executado', fmtCurrency(p.financeiro.executado)]);
      rows.push(['Saldo', fmtCurrency(p.financeiro.saldo)]);
    }
    if (p.contrapartidas !== undefined) rows.push(['Contrapartidas', `${p.contrapartidas} item(ns)`]);
    if (p.riscos !== undefined) rows.push(['Riscos abertos', String(p.riscos)]);
    if (p.mudancas !== undefined) rows.push(['Mudanças', String(p.mudancas)]);
    if (p.evidencias !== undefined) rows.push(['Evidências', `${p.evidencias} anexo(s)`]);

    if (rows.length > 0) {
      autoTable(doc, {
        startY: y,
        body: rows,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 120, textColor: 90 }, 1: { textColor: 30 } },
        margin: { left: marginX, right: marginX },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (p.metas && p.metas.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Meta', 'Progresso']],
        body: p.metas.map(m => [m.name, `${m.done}/${m.total} atividades concluídas`]),
        theme: 'striped',
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: marginX, right: marginX },
      });
      y = (doc as any).lastAutoTable.finalY + 18;
    } else {
      y += 18;
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
