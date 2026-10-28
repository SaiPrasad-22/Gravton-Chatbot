import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Widget } from './components/chat/Widget';
import './styles/original.css';
import './styles/chat.css';
import './styles/enhancements.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <Widget />
  </StrictMode>,
);
