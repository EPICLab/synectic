import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import './assets/style.css';
import { rootReducer } from './store/root';
import { CanvasComponent } from './components/CanvasComponent';
import { importFiletypes } from './containers/handlers';

export const store = createStore(rootReducer);
// const cards = generateCards(3);
// cards.map(card => store.dispatch({ type: ActionKeys.ADD_CARD, id: card.id, card: card }));

const App = (): JSX.Element => {

  useEffect(() => {
    // load all supported filetype handlers into Redux store
    async function fetchData() {
      await importFiletypes();
    }
    fetchData();
  }, []);

  return (
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <React.Fragment>
          <CanvasComponent {...store.getState().canvas}>
            <div>...End of Cards...</div>
          </CanvasComponent>
        </React.Fragment>
      </DndProvider>
    </Provider>
  )
};

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
