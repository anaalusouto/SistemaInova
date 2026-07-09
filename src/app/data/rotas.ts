// Rotas e Cronograma 2026 — seed do arquivo Instituições_e_Rotas.

export interface RotaItem {
  id: number;
  rota: string;
  organizacao: string;
  municipio: string;
  uf: string;
  diasAtuacao: number;
  modalAcesso: string;
  tipoComunidade: string;
  notasLogisticas: string;
}

export const rotas: RotaItem[] = [
  { id: 1,  rota: 'ROTA 1',  organizacao: 'COPASMIG', municipio: 'São Miguel do Guamá', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Quilombola', notasLogisticas: '' },
  { id: 2,  rota: 'ROTA 1',  organizacao: 'MALUNGU', municipio: 'São Miguel do Guamá', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Quilombola', notasLogisticas: '' },
  { id: 3,  rota: 'ROTA 1',  organizacao: 'ADESC', municipio: 'Santa Maria do Pará / Maracanã', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Tradicional', notasLogisticas: 'Apoio local adicional possível' },
  { id: 4,  rota: 'ROTA 2',  organizacao: 'TAUARI', municipio: 'Capanema', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Agricultura Familiar', notasLogisticas: '' },
  { id: 5,  rota: 'ROTA 2',  organizacao: 'CAANP-AGROMEL', municipio: 'São João de Pirabas', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Agricultura Familiar', notasLogisticas: '' },
  { id: 6,  rota: 'ROTA 2',  organizacao: 'COOPAVISEU', municipio: 'Viseu', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Agricultura Familiar', notasLogisticas: '' },
  { id: 7,  rota: 'ROTA 3',  organizacao: 'Assoc. Mulheres Indígenas do Gurupi', municipio: 'Paragominas — Vila Caip', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado (obrigatório)', tipoComunidade: 'Indígena', notasLogisticas: 'Ônibus local só 2h–6h manhã' },
  { id: 8,  rota: 'ROTA 4',  organizacao: 'Nova Betel', municipio: 'Tomé-Açu / Quatro Bocas', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Quilombola', notasLogisticas: '' },
  { id: 9,  rota: 'ROTA 4',  organizacao: "Turiwara-Ka'i", municipio: 'Tomé-Açu / Quatro Bocas', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Indígena', notasLogisticas: 'Combustível interno; validar estrada' },
  { id: 10, rota: 'ROTA 5',  organizacao: 'ARQUIA', municipio: 'Abaetetuba', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Terrestre/Fluvial', tipoComunidade: 'Quilombola', notasLogisticas: 'Rota flexível' },
  { id: 11, rota: 'ROTA 6',  organizacao: 'COOMAP', municipio: 'Oeiras do Pará', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Fluvial – lancha/navio', tipoComunidade: 'Tradicional', notasLogisticas: 'Embarcação própria + combustível' },
  { id: 12, rota: 'ROTA 7',  organizacao: 'MANEJAÍ', municipio: 'Portel', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Navio regional / Lancha', tipoComunidade: 'Tradicional', notasLogisticas: 'Sem tempo de viagem confirmado' },
  { id: 13, rota: 'ROTA 8',  organizacao: 'ATAIC — Agroextrativistas', municipio: 'Macapá/Santana', uf: 'AP', diasAtuacao: 2, modalAcesso: 'Avião + Carro + Lancha', tipoComunidade: 'Tradicional', notasLogisticas: 'Operação via Macapá/Santana' },
  { id: 14, rota: 'ROTA 9',  organizacao: 'COOPAFS', municipio: 'Santarém', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Avião', tipoComunidade: 'Agricultura Familiar', notasLogisticas: '' },
  { id: 15, rota: 'ROTA 9',  organizacao: 'AASFLOR', municipio: 'Uruará', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Agricultura Familiar', notasLogisticas: 'Estrada Santarém–Uruará; carro robusto' },
  { id: 16, rota: 'ROTA 10', organizacao: 'ARQMO', municipio: 'Oriximiná', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Avião + Barco + Voadeira', tipoComunidade: 'Quilombola', notasLogisticas: 'Alta dependência climática' },
  { id: 17, rota: 'ROTA 10', organizacao: 'AIKATUK', municipio: 'Oriximiná', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Barco + Voadeira', tipoComunidade: 'Indígena', notasLogisticas: 'Combustível p/ voadeiras; contingência' },
  { id: 18, rota: 'ROTA 11', organizacao: 'Assoc. Mebengokre Yte Kayapo', municipio: 'Redenção', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Avião + Van/4x4', tipoComunidade: 'Indígena', notasLogisticas: 'Coordenação com lideranças' },
  { id: 19, rota: 'ROTA 11', organizacao: "Assoc. Indígena Riktikô 'Ronkô'", municipio: 'Cumaru do Norte', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Van/4x4', tipoComunidade: 'Indígena', notasLogisticas: 'Estradas; carro fretado até aldeias' },
  { id: 20, rota: 'ROTA 12', organizacao: 'ACREPAF', municipio: 'Jacundá', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado/SUV', tipoComunidade: 'Tradicional', notasLogisticas: 'Longa distância; avaliar via Marabá' },
];

export type CalendarEventType = 'Visita técnica' | 'Prazo' | 'Logística' | 'Reunião' | 'Capacitação' | 'Outro';

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;              // YYYY-MM-DD
  type: CalendarEventType;
  rotaId?: number | null;
  comunidadeId?: number | null;
  responsavel?: string;
  observacoes?: string;
}

export const calendarSeed: CalendarEvent[] = [
  { id: 1, title: 'Kickoff INOVA FAS/FUNBIO 2026',       date: '2026-01-15', type: 'Reunião',       rotaId: null, comunidadeId: null, responsavel: 'Coordenação CRIA' },
  { id: 2, title: 'Repasse ADESC/PA',                    date: '2026-04-01', type: 'Prazo',         rotaId: 3, comunidadeId: 1 },
  { id: 3, title: 'Repasse ATRT (Tauari)',               date: '2026-02-12', type: 'Prazo',         rotaId: 4, comunidadeId: 2 },
  { id: 4, title: 'Repasse AASFLOR',                     date: '2026-04-16', type: 'Prazo',         rotaId: 15, comunidadeId: 3 },
  { id: 5, title: 'Repasse COOPAVISEU',                  date: '2026-04-06', type: 'Prazo',         rotaId: 6, comunidadeId: 5 },
  { id: 6, title: 'Repasse CAANP-AGROMEL',               date: '2026-03-10', type: 'Prazo',         rotaId: 5, comunidadeId: 6 },
  { id: 7, title: 'Visita técnica ROTA 1 (ADESC)',       date: '2026-05-05', type: 'Visita técnica', rotaId: 3, comunidadeId: 1 },
  { id: 8, title: 'Visita técnica ROTA 2 (Tauari)',      date: '2026-05-12', type: 'Visita técnica', rotaId: 4, comunidadeId: 2 },
  { id: 9, title: 'Visita técnica ROTA 9 (Santarém)',    date: '2026-06-10', type: 'Visita técnica', rotaId: 14, comunidadeId: 17 },
  { id: 10, title: 'Capacitação BPF (Tauari)',            date: '2026-06-20', type: 'Capacitação',   rotaId: 4, comunidadeId: 2 },
  { id: 11, title: 'MVP Laboratório Fábrica',             date: '2026-08-15', type: 'Capacitação',   rotaId: null, comunidadeId: null },
  { id: 12, title: 'Encerramento anual — relatoria',      date: '2026-12-15', type: 'Prazo',         rotaId: null, comunidadeId: null },
];
