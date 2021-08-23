import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './index.css';
import './assets/style.css';
import store from './store/store';
import CanvasComponent from './components/CanvasComponent';
import { importFiletypes } from './containers/handlers';

const App = (): JSX.Element => {

  useEffect(() => {
    store.dispatch(importFiletypes()); // load all supported filetype handlers into Redux store
  }, []); // run the effect only once; after the first render

  return (
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <CanvasComponent />
      </DndProvider>
    </Provider>
  );
};

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
