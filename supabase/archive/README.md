Este diretório não participa do fluxo automático de migrações.

`9998_fix_orphaned_child_tables.sql` é um reparo manual antigo, feito quando as tabelas estavam vazias. Ele apagava tabelas e exigia recriar o esquema manualmente. Executá-lo ao final das migrações destrói tabelas necessárias à aplicação. Foi arquivado em 18/10/2026; não executar em banco com dados.

O registro original do histórico remoto foi preservado em `docs/evidencias/historico-migracoes-antes-ajuste-20261018.json`. Arquivar esse arquivo e retirar seu marcador do histórico não desfaz nem reaplica SQL no banco publicado.
