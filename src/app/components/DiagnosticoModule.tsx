import { useState } from 'react';
import { DiagnosticoVisaoGeral } from './DiagnosticoVisaoGeral';
import { DiagnosticoOrganizacao } from './DiagnosticoOrganizacao';
import { DiagnosticoEditor } from './DiagnosticoEditor';

type View =
  | { name: 'geral' }
  | { name: 'organizacao'; comunidadeId: string }
  | { name: 'editor'; comunidadeId: string; diagnosticoId: string };

export function DiagnosticoModule() {
  const [view, setView] = useState<View>({ name: 'geral' });

  if (view.name === 'geral') {
    return <DiagnosticoVisaoGeral onSelectOrganizacao={comunidadeId => setView({ name: 'organizacao', comunidadeId })} />;
  }
  if (view.name === 'organizacao') {
    return (
      <DiagnosticoOrganizacao
        comunidadeId={view.comunidadeId}
        onBack={() => setView({ name: 'geral' })}
        onSelectDiagnostico={diagnosticoId => setView({ name: 'editor', comunidadeId: view.comunidadeId, diagnosticoId })}
      />
    );
  }
  return (
    <DiagnosticoEditor
      diagnosticoId={view.diagnosticoId}
      onBack={() => setView({ name: 'organizacao', comunidadeId: view.comunidadeId })}
      onNovaVersao={novoId => setView({ name: 'editor', comunidadeId: view.comunidadeId, diagnosticoId: novoId })}
    />
  );
}
