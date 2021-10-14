import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './index.css';
import './assets/style.css';
import redux from './store/store';
import CanvasComponent from './components/CanvasComponent';
import { importFiletypes } from './containers/handlers';
import { PersistGate } from 'redux-persist/integration/react';

const App = (): JSX.Element => {

  useEffect(() => {
    redux.store.dispatch(importFiletypes()); // load all supported filetype handlers into Redux store
  }, []); // run the effect only once; after the first render

  return (
    <Provider store={redux.store}>
      <PersistGate loading={null} persistor={redux.persistor}>
        <DndProvider backend={HTML5Backend}>
          <CanvasComponent />
        </DndProvider>
      </PersistGate>
    </Provider>
  );
};

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
