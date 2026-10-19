# Instruções do repositório

## Migrações de banco

- Antes de criar ou alterar uma migração, ler as migrações anteriores em ordem e conferir as tabelas, colunas, índices, funções, gatilhos, permissões e dependências já definidos. Não presumir que uma estrutura ainda não existe.
- Conferir a sequência e os nomes existentes antes de gerar um arquivo. Quando houver acesso autorizado ao banco, comparar também o histórico aplicado; não confundir arquivos locais com estado remoto confirmado.
- Preservar os dados existentes. Não recriar ou apagar tabelas para resolver conflitos de nomes. Verificar compatibilidade de estrutura antes de reutilizar objetos preexistentes.
- Não renumerar migrações já aplicadas para tentar reaplicá-las. Tratar o histórico e a correção explicitamente, conforme o estado verificado do ambiente.
- Validar a sequência completa em PostgreSQL isolado. Quando o SQL precisar permitir reexecução, testar também banco preenchido e aplicação parcial, comprovando a preservação dos registros.
- Não aplicar alterações em serviços externos nem publicar em produção sem autorização do usuário.
