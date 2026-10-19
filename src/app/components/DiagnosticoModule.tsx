import { useState } from 'react';
import { DiagnosticoVisaoGeral } from './DiagnosticoVisaoGeral';
import { DiagnosticoOrganizacao } from './DiagnosticoOrganizacao';
import { DiagnosticoEditor } from './DiagnosticoEditor';

type View =
  | { name: 'geral' }
  | { name: 'organizacao'; comunidadeId: string }
  | { name: 'editor'; comunidadeId: string; diagnosticoId: string };

export function DiagnosticoModule({ comunidadeId, instrumentoInicial = 'matriz' }: { comunidadeId?: string; instrumentoInicial?: 'matriz' | 'parecer' }) {
  const [view, setView] = useState<View>(comunidadeId ? {name:'organizacao',comunidadeId} : { name: 'geral' });

  if (view.name === 'geral') {
    return <DiagnosticoVisaoGeral onSelectOrganizacao={comunidadeId => setView({ name: 'organizacao', comunidadeId })} />;
  }
  if (view.name === 'organizacao') {
    return (
      <DiagnosticoOrganizacao
        comunidadeId={view.comunidadeId}
        incorporado={!!comunidadeId}
        onBack={() => setView({ name: 'geral' })}
        onSelectDiagnostico={diagnosticoId => setView({ name: 'editor', comunidadeId: view.comunidadeId, diagnosticoId })}
      />
    );
  }
  return (
    <DiagnosticoEditor
      key={view.diagnosticoId}
      diagnosticoId={view.diagnosticoId}
      incorporado={!!comunidadeId}
      instrumentoInicial={instrumentoInicial}
      onBack={() => setView({ name: 'organizacao', comunidadeId: view.comunidadeId })}
      onNovaVersao={novoId => setView({ name: 'editor', comunidadeId: view.comunidadeId, diagnosticoId: novoId })}
    />
  );
}
