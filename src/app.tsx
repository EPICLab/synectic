import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './index.css';
import './assets/style.css';
import redux from './store/store';
import { importFiletypes } from './store/thunks/filetypes';
import { PersistGate } from 'redux-persist/integration/react';
import { FSCacheProvider } from './store/cache/FSCache';
import Canvas from './components/Canvas';

const App = (): JSX.Element => {

  useEffect(() => {
    console.log(`process.env.NODE_ENV: ${process.env.NODE_ENV}`);
    redux.store.dispatch(importFiletypes()); // load all supported filetype handlers into Redux store
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

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
