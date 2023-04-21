/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications.
 */
import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { version } from '../package.json';
import './assets/style.css';
import Canvas from './components/Canvas/Canvas';
import filetypesJson from './containers/filetypes.json';
import './index.css';
import { FSCacheProvider } from './store/cache/FSCache';
import { Filetype } from './store/slices/filetypes';
import redux from './store/store';
import { importFiletypes } from './store/thunks/filetypes';

export const isRenderer = typeof process === 'undefined' || !process || process.type === 'renderer';

const App = (): JSX.Element => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🧪 Synectic: ${version}, NODE_ENV: ${process.env.NODE_ENV}, Electron: ${
          isRenderer ? 'renderer' : 'main'
        } 🧪`
      );
    }
    redux.store.dispatch(importFiletypes(filetypesJson as Omit<Filetype, 'id'>[])); // load all supported filetype handlers into Redux store
    // redux.persistor.purge(); // remove all cached Redux data
  }, []); // run the effect only once; after the first render

  return (
    <Provider store={redux.store}>
      <PersistGate loading={null} persistor={redux.persistor}>
        <DndProvider backend={HTML5Backend}>
          <FSCacheProvider>
            <Canvas />
          </FSCacheProvider>
        </DndProvider>
      </PersistGate>
    </Provider>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
root.render(<App />);
