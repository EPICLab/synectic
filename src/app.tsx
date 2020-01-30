import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import './assets/style.css';
import { rootReducer } from './store/root';
import CanvasComponent from './components/CanvasComponent';
// import { importFiletypes } from './containers/handlers';

export const store = createStore(rootReducer);

const App = (): JSX.Element => {

  // useEffect(() => {
  //   async function fetchData() {
  //     const actions = await importFiletypes();
  //     actions.map(action => store.dispatch(action)); // load all supported filetype handlers into Redux store
  //   }
  //   fetchData();
  // }, []);

  // <CanvasComponent {...store.getState().canvas} />

  return (
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <React.Fragment>
          <CanvasComponent id={'23423'} />
        </React.Fragment>
      </DndProvider>
    </Provider>
  );
};

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
