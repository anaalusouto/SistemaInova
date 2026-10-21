/** Paleta institucional CRIA. Só o fundo da escala usa transparência. */
export const CORES_INSTITUCIONAIS = {
  fundo: '#FFFCF8',
  superficie: '#FFFFFF',
  acao: '#344980',
  texto: '#253253',
} as const;

export const CORES_ESCALA = {
  1: { base: '#B5473C', destaque: '#8E3027', fundo: 'rgba(181, 71, 60, 0.08)' },
  2: { base: '#C47735', destaque: '#874718', fundo: 'rgba(196, 119, 53, 0.08)' },
  3: { base: '#D3AD3E', destaque: '#705917', fundo: 'rgba(211, 173, 62, 0.08)' },
  4: { base: '#58805B', destaque: '#365C39', fundo: 'rgba(88, 128, 91, 0.08)' },
} as const;
