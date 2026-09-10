import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

// ponytail: no StrictMode — Cosmos owns a WebGL device/canvas and doesn't
// tolerate the deliberate mount/destroy/remount double-invoke.
createRoot(document.getElementById('root')!).render(<App />);
