import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { PortfolioView } from '../../src/app/components/PortfolioView';
import '../../src/styles.css';

createRoot(document.getElementById('root')!).render(<>
  <p className="p-4 bg-muted">Teste isolado com dados sintéticos — sem acesso ao banco.
    {' '}<a href="?consulta">Perfil de consulta</a> · <a href="?falha">Falha de gravação</a> · <a href="/">Edição</a>
  </p>
  <PortfolioView />
  <Toaster />
</>);
