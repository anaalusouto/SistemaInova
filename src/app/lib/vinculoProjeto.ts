export function exigirOrganizacaoNaCriacao(id: unknown): string {
  if (typeof id !== 'string' || !id.trim()) throw new Error('Selecione a organização à qual o projeto será vinculado.');
  return id.trim();
}

/** O vínculo não faz parte dos campos editáveis, inclusive em chamadas diretas. */
export function validarPatchVinculo(patch: object): void {
  for (const campo of ['comunidadeId', 'comunidade_id', 'communityId', 'organizacao', 'org']) {
    if (Object.prototype.hasOwnProperty.call(patch, campo)) {
      throw new Error('O vínculo com a organização não pode ser alterado após a criação do projeto.');
    }
  }
}
