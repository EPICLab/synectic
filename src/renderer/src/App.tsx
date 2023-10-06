import { styled } from '@mui/material';
import { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import type { Filetype } from 'types/filetype';
import { AppThemeProvider } from './components/AppTheme';
import Canvas from './components/Canvas';
import filetypesJson from './containers/filetypes.json';
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
