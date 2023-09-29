import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './assets/index.css';

const container = document.getElementById('root');
const root = createRoot(container!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
