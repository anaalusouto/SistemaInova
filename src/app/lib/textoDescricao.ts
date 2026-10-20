export type BlocoDescricao =
  | { tipo: 'paragrafo'; texto: string }
  | { tipo: 'lista'; ordenada: boolean; itens: { texto: string; numero?: number }[] };

/** Formatação de leitura; nunca modifica o texto armazenado nem interpreta HTML. */
export function formatarTextoDescricao(valor: string | number, rotulo: string) {
  const linhas = String(valor).replace(/\r\n?|\f/g, '\n').split('\n')
    .map(linha => linha.replace(/[\t\u00a0 ]+/g, ' ').trim());
  while (linhas[0] === '') linhas.shift();
  // O título já é apresentado pelo campo; evita repeti-lo nos textos importados.
  const titulo = (texto: string) => texto.replace(/:$/, '').toLocaleLowerCase('pt-BR');
  if (linhas.length > 1 && titulo(linhas[0]) === titulo(rotulo)) linhas.shift();
  const texto = linhas.join('\n').trim();
  let orientacao: string | undefined;
  let conteudo = texto;
  // Orientações copiadas do formulário ficam separadas da resposta da proposta.
  if (/^\(instrução\s*:/i.test(texto)) {
    let nivel = 0;
    for (let i = 0; i < texto.length; i++) {
      if (texto[i] === '(') nivel++;
      if (texto[i] === ')') nivel--;
      if (nivel === 0) {
        orientacao = texto.slice(0, i + 1).replace(/\s+/g, ' ');
        conteudo = texto.slice(i + 1).replace(/^\.?\s*/, '');
        break;
      }
    }
  }
  const blocos: BlocoDescricao[] = [];
  let partes: string[] = [];
  let lista: Extract<BlocoDescricao, { tipo: 'lista' }> | undefined;
  let separacao = false;
  const juntar = (trechos: string[]) => trechos.join('\n')
    .replace(/([\p{L}])-\n(?=\p{L})/gu, '$1-').replace(/\s+/g, ' ').trim();
  const concluirParagrafo = () => {
    if (partes.length) blocos.push({ tipo: 'paragrafo', texto: juntar(partes) });
    partes = [];
  };
  for (const linha of conteudo.split('\n')) {
    if (!linha) {
      concluirParagrafo();
      separacao = true;
      // A linha vazia entre itens não encerra uma lista.
      continue;
    }
    const marcador = /^(?:[•●▪◦‣*-]\s+|([0-9]{1,3})[.)]\s+)(.*)$/.exec(linha);
    if (marcador) {
      concluirParagrafo();
      const ordenada = marcador[1] !== undefined;
      if (!lista || lista.ordenada !== ordenada) {
        lista = { tipo: 'lista', ordenada, itens: [] };
        blocos.push(lista);
      }
      lista.itens.push({ texto: marcador[2], ...(ordenada ? { numero: Number(marcador[1]) } : {}) });
    } else if (lista && !separacao && partes.length === 0) {
      // Continuação de um item quebrado pela largura da página do PDF.
      const item = lista.itens[lista.itens.length - 1];
      item.texto = juntar([item.texto, linha]);
    } else {
      lista = undefined;
      partes.push(linha);
    }
    separacao = false;
  }
  concluirParagrafo();
  return { orientacao, blocos };
}
