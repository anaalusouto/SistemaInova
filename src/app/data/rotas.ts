// Rotas e Cronograma 2026 — coordenadas sincronizadas com o mapa
// "INSTITUIÇÕES INOVA SOCIOBIO" (Google My Maps).

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
  lat?: number;
  lng?: number;
  status?: 'Operacional' | 'Atenção' | 'Crítico';
}

// Cores por tipo de comunidade — replicam o legend do My Maps.
export const tipoComunidadeColors: Record<string, string> = {
  'Quilombola': '#9C27B0',
  'Indígena': '#FBC02D',
  'Tradicional': '#0288D1',
  'Agricultura Familiar': '#A52714',
};

export const rotas: RotaItem[] = [
  { id: 1,  rota: 'ROTA 1',  organizacao: 'COOPASMIG', municipio: 'São Miguel do Guamá', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Quilombola', notasLogisticas: '', lat: -1.6138252, lng: -47.4755448, status: 'Operacional' },
  { id: 2,  rota: 'ROTA 1',  organizacao: 'MALUNGU', municipio: 'São Miguel do Guamá', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Quilombola', notasLogisticas: '', lat: -1.6209884, lng: -47.4790888, status: 'Operacional' },
  { id: 3,  rota: 'ROTA 1',  organizacao: 'ADESC', municipio: 'Santa Maria do Pará / Maracanã', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Tradicional', notasLogisticas: 'Apoio local adicional possível', lat: -1.3586364, lng: -47.5723983, status: 'Operacional' },
  { id: 4,  rota: 'ROTA 2',  organizacao: 'Associação de Trabalhadores Rurais de Tauari', municipio: 'Capanema', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Agricultura Familiar', notasLogisticas: '', lat: -1.1922171, lng: -47.1788727, status: 'Operacional' },
  { id: 5,  rota: 'ROTA 2',  organizacao: 'CAANP AGROMEL', municipio: 'São João de Pirabas', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Agricultura Familiar', notasLogisticas: '', lat: -0.7726113, lng: -47.1772191, status: 'Operacional' },
  { id: 6,  rota: 'ROTA 2',  organizacao: 'COOPAVISEU', municipio: 'Viseu', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Agricultura Familiar', notasLogisticas: '', lat: -1.2066664, lng: -46.1379734, status: 'Operacional' },
  { id: 7,  rota: 'ROTA 3',  organizacao: 'Associação das Mulheres Indígenas do Gurupi', municipio: 'Paragominas — Vila Caip', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado (obrigatório)', tipoComunidade: 'Indígena', notasLogisticas: 'Ônibus local só 2h–6h manhã', lat: -2.9445145, lng: -46.7489353, status: 'Atenção' },
  { id: 8,  rota: 'ROTA 4',  organizacao: 'NOVA BETEL', municipio: 'Tomé-Açu / Quatro Bocas', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Quilombola', notasLogisticas: '', lat: -2.2353987, lng: -48.2443456, status: 'Atenção' },
  { id: 9,  rota: 'ROTA 4',  organizacao: "TURIWARA-KA'I", municipio: 'Tomé-Açu / Quatro Bocas', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Indígena', notasLogisticas: 'Combustível interno; validar estrada', lat: -2.3176419, lng: -48.339257, status: 'Atenção' },
  { id: 10, rota: 'ROTA 5',  organizacao: 'ARQUIA', municipio: 'Abaetetuba', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Terrestre/Fluvial', tipoComunidade: 'Quilombola', notasLogisticas: 'Rota flexível', lat: -1.8353454, lng: -48.9484922, status: 'Operacional' },
  { id: 11, rota: 'ROTA 6',  organizacao: 'COOMAP', municipio: 'Oeiras do Pará', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Fluvial – lancha/navio', tipoComunidade: 'Tradicional', notasLogisticas: 'Embarcação própria + combustível', lat: -2.3492261, lng: -50.0041224, status: 'Atenção' },
  { id: 12, rota: 'ROTA 7',  organizacao: 'MANEJAI', municipio: 'Portel', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Navio regional / Lancha', tipoComunidade: 'Tradicional', notasLogisticas: 'Sem tempo de viagem confirmado', lat: -1.9398865, lng: -50.8227352, status: 'Atenção' },
  { id: 13, rota: 'ROTA 8',  organizacao: 'ATAIC — Agroextrativistas', municipio: 'Macapá/Santana', uf: 'AP', diasAtuacao: 2, modalAcesso: 'Avião + Carro + Lancha', tipoComunidade: 'Tradicional', notasLogisticas: 'Operação via Macapá/Santana', lat: -0.4783191, lng: -51.3665859, status: 'Atenção' },
  { id: 14, rota: 'ROTA 9',  organizacao: 'COOPAFS', municipio: 'Santarém', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Avião', tipoComunidade: 'Agricultura Familiar', notasLogisticas: '', lat: -2.4450177, lng: -54.686582, status: 'Operacional' },
  { id: 15, rota: 'ROTA 9',  organizacao: 'AASFLOR', municipio: 'Uruará', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado', tipoComunidade: 'Agricultura Familiar', notasLogisticas: 'Estrada Santarém–Uruará; carro robusto', lat: -3.7211047, lng: -53.7315663, status: 'Operacional' },
  { id: 16, rota: 'ROTA 10', organizacao: 'ARQMO', municipio: 'Oriximiná', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Avião + Barco + Voadeira', tipoComunidade: 'Quilombola', notasLogisticas: 'Alta dependência climática', lat: -1.7758821, lng: -55.8638725, status: 'Atenção' },
  { id: 17, rota: 'ROTA 10', organizacao: 'AIKATUK', municipio: 'Oriximiná', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Barco + Voadeira', tipoComunidade: 'Indígena', notasLogisticas: 'Combustível p/ voadeiras; contingência', lat: 0.0006768, lng: -57.0547936, status: 'Atenção' },
  { id: 18, rota: 'ROTA 11', organizacao: 'ASSOCIAÇÃO MEBENGÔKRE YTE KAYAPO', municipio: 'Redenção', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Avião + Van/4x4', tipoComunidade: 'Indígena', notasLogisticas: 'Coordenação com lideranças', lat: -8.0272665, lng: -50.0248941, status: 'Atenção' },
  { id: 19, rota: 'ROTA 11', organizacao: 'Associação Indígena Riktikô "Ronkô"', municipio: 'Cumaru do Norte', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Van/4x4', tipoComunidade: 'Indígena', notasLogisticas: 'Estradas; carro fretado até aldeias', lat: -7.8113772, lng: -50.767637, status: 'Atenção' },
  { id: 20, rota: 'ROTA 12', organizacao: 'ACREPAF', municipio: 'Jacundá', uf: 'PA', diasAtuacao: 2, modalAcesso: 'Carro fretado/SUV', tipoComunidade: 'Tradicional', notasLogisticas: 'Longa distância; avaliar via Marabá', lat: -4.4464221, lng: -49.1170862, status: 'Atenção' },
];


export type CalendarEventType = 'Visita técnica' | 'Prazo' | 'Logística' | 'Reunião' | 'Capacitação' | 'Outro';

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;              // YYYY-MM-DD
  startTime?: string;        // HH:MM
  endTime?: string;          // HH:MM
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
