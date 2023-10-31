/// <reference types="vite-plugin-svgr/client" />

import type {Filetype} from '@syn-types/filetype';
import {useEffect} from 'react';
import {Provider} from 'react-redux';
import {AppThemeProvider} from './components/AppTheme';
import Canvas from './components/Canvas';
import filetypesJson from './containers/filetypes.json';
import redux from './store/store';
import {importFiletypes} from './store/thunks/filetypes';

const App = () => {
  useEffect(() => {
    redux.store.dispatch(importFiletypes(filetypesJson as Omit<Filetype, 'id'>[])); // load all supported filetype handlers into Redux store
  }, []); // run the effect only once; after the first render

  return (
    <Provider store={redux.store}>
      <AppThemeProvider>
        <Canvas />
      </AppThemeProvider>
    </Provider>
  );
};
export default App;
