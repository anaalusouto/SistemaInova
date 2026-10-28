import { QUESTIONARIO_CADERNO } from './catalog/cadernoCria';
import type { RegistroCaderno } from './cadernoCria';

// Agrupamento analítico do sistema. Códigos, públicos e descritores seguem o
// caderno. Respostas do instrumento anterior não são convertidas.
export const DIMENSOES_IEO_CADERNO = [
  { id: '1', titulo: 'Governança e Base dos Membros', codigos: ['Q01', 'Q03', 'Q06', 'Q07', 'Q08', 'Q25'] },
  { id: '2', titulo: 'Gestão e Capacidade Organizacional', codigos: ['Q02', 'Q04', 'Q05', 'Q20', 'Q22'] },
  { id: '3', titulo: 'Gestão Econômica-Financeira', codigos: ['Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q19'] },
  { id: '4', titulo: 'Geração de Valor e Articulação', codigos: ['Q09', 'Q10', 'Q16', 'Q17', 'Q18'] },
  { id: '5', titulo: 'Regularidade e Gestão de Riscos', codigos: ['Q21', 'Q23', 'Q24'] },
].map(d => ({ ...d, perguntas: d.codigos.map(c => QUESTIONARIO_CADERNO.find(q => q.codigo === c)!) }));

export function calcularIeoCaderno(registros: Pick<RegistroCaderno, 'codigo' | 'contexto' | 'resposta'>[]) {
  const respostas = new Map(registros.filter(r => r.contexto === '').map(r => [r.codigo, r.resposta]));
  const porDimensao = DIMENSOES_IEO_CADERNO.map(d => {
    const valores = d.codigos.map(c => respostas.get(c)?.valor);
    const notas = valores.filter((v): v is string => typeof v === 'string' && /^[1-4]$/.test(v)).map(Number);
    return {
      dimensaoId: d.id, dimensaoTitulo: d.titulo, total: d.codigos.length,
      respondidas: valores.filter(v => v != null).length, pontuadas: notas.length,
      media: notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null,
    };
  });
  const medias = porDimensao.map(d => d.media).filter((v): v is number => v !== null);
  return {
    geral: medias.length ? medias.reduce((s, n) => s + n, 0) / medias.length : null,
    porDimensao,
    respondidas: porDimensao.reduce((s, d) => s + d.respondidas, 0),
    pontuadas: porDimensao.reduce((s, d) => s + d.pontuadas, 0),
    total: QUESTIONARIO_CADERNO.length,
  };
}
