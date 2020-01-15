import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import './assets/style.css';
import { rootReducer } from './store/root';
import { CanvasComponent } from './components/CanvasComponent';
import { FileTreeComponent } from './components/FileExplorer';
import { importFiletypes } from './containers/handlers';

export const store = createStore(rootReducer);
// const cards = generateCards(3);
// cards.map(card => store.dispatch({ type: ActionKeys.ADD_CARD, id: card.id, card: card }));

const App = (): JSX.Element => {

  useEffect(() => {
    console.log(store);
    // load all supported filetype handlers into Redux store
    async function fetchData() {
      const actions = await importFiletypes();
      actions.map(action => store.dispatch(action));
      // const action = await extractMetafile('/Users/nelsonni/Workspace/synectic/src/containers/filetypes.json', Object.values(store.getState().filetypes));
      // store.dispatch(action);
      // const metafiles = Object.values(store.getState().metafiles);
      // metafiles.map(metafile => loadCard(metafile));
    }
    fetchData();
  }, []);

  return (
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <React.Fragment>
          <CanvasComponent {...store.getState().canvas}>
            <FileTreeComponent path='' />
          </CanvasComponent>
        </React.Fragment>
      </DndProvider>
    </Provider >
  );
};

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
