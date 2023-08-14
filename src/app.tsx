import { styled } from '@mui/material';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { AppThemeProvider } from './components/AppTheme';
import Canvas from './components/Canvas';
import filetypesJson from './containers/filetypes.json';
import type { Filetype } from './store/slices/filetypes';
import redux from './store/store';
import { importFiletypes } from './store/thunks/filetypes';

const Error = styled('div')(() => ({
  color: '#FF0000'
}));

const App = () => {
  useEffect(() => {
    redux.store.dispatch(importFiletypes(filetypesJson as Omit<Filetype, 'id'>[])); // load all supported filetype handlers into Redux store
  }, []); // run the effect only once; after the first render

  return (
    <Provider store={redux.store}>
      <AppThemeProvider>
        <ErrorBoundary fallback={<Error>💥Canvas Error💥</Error>}>
          <Canvas />
        </ErrorBoundary>
      </AppThemeProvider>
    </Provider>
  );
};

export default App;

const container = document.getElementById('root');
const root = createRoot(container!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
root.render(<App />);
