/** As respostas IM existentes guardam os campos no relato e o prazo junto ao responsável. */
export function lerRelatoImplantacao(relato: string) {
  const campos = { existe: '', falta: '', proximo: '', outros: '' };
  let atual: keyof typeof campos = 'outros';
  const nomes: Record<string, keyof typeof campos> = { 'o que existe': 'existe', 'o que falta': 'falta', 'próximo passo': 'proximo' };
  const vistos = new Set<string>();
  for (const linha of relato.split('\n')) {
    const match = /^(O que existe|O que falta|Próximo passo):\s*(.*)$/i.exec(linha);
    const chave = match ? nomes[match[1].toLocaleLowerCase('pt-BR')] : undefined;
    if (chave && !vistos.has(chave)) { atual = chave; vistos.add(chave); campos[chave] = match![2]; }
    else { if (chave) atual = 'outros'; campos[atual] += `${campos[atual] ? '\n' : ''}${linha}`; }
  }
  return campos;
}

export function escreverRelatoImplantacao(c: ReturnType<typeof lerRelatoImplantacao>) {
  return [c.existe && `O que existe: ${c.existe}`, c.falta && `O que falta: ${c.falta}`, c.proximo && `Próximo passo: ${c.proximo}`, c.outros].filter(Boolean).join('\n');
}

export function lerResponsavelImplantacao(texto: string) {
  const match = /^(.*?);\s*prazo\s*:?\s*(.+)$/i.exec(texto.trim());
  if (match) return { responsavel: match[1].trim(), prazo: match[2].trim() };
  const apenasPrazo = /^prazo\s*:?\s*(.+)$/i.exec(texto.trim());
  return apenasPrazo ? { responsavel: '', prazo: apenasPrazo[1].trim() } : { responsavel: texto, prazo: '' };
}

export function escreverResponsavelImplantacao(responsavel: string, prazo: string) {
  return [responsavel.trim(), prazo.trim() ? `Prazo: ${prazo.trim()}` : ''].filter(Boolean).join('; ');
}
