import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';
import { createStore } from 'redux';

import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

// import { DateTime } from 'luxon';

// import Example from './old-components/Example';
// import CardListComponent from './components/CardList';
// import CanvasComponent from './components/Canvas';
// import UserList from './old-components/UserList';
import './assets/style.css';
import { rootReducer } from './store/root';
import { ActionKeys } from './store/actions';
import { generateCards } from './containers/genFakedCards';
import { CanvasComponent } from './components/CanvasComponent';
import { FileTreeComponent } from './components/FileExplorer';

export const store = createStore(rootReducer);
const cards = generateCards(3);
cards.map(card => store.dispatch({ type: ActionKeys.ADD_CARD, id: card.id, card: card }));

const App = (): JSX.Element => {
  // const users = [
  //   { name: 'bob', modified: DateTime.local(), onClick: () => console.log('name: bob'), selected: false },
  //   { name: 'sally', modified: DateTime.local(), onClick: () => console.log('name: sally'), selected: false }
  // ]

  return (
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <React.Fragment>
          <CanvasComponent {...store.getState().canvas}>
            <div>...End of Cards...</div>
            <FileTreeComponent {...'directory goes here?'} />
          </CanvasComponent>
        </React.Fragment>
      </DndProvider>
    </Provider>
  )
};

/**
          <CanvasComp {...store.getState().canvas}>
            <div>...End of Cards...</div>
          </CanvasComp>

<CanvasComponent>
  <UserList users={users}></UserList>
  <Example />
  <CardListComponent />
</CanvasComponent>
 */

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
