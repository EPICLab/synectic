import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';
import { createStore } from 'redux';

import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import { DateTime } from 'luxon';

import Example from './old-components/Example';
import Canvas from './components/Canvas';
import UserList from './old-components/UserList';
import './assets/style.css';
import todos from './reducers/todos';

const store = createStore(todos);

const App = (): JSX.Element => {
  const users = [
    { name: 'bob', modified: DateTime.local(), onClick: () => console.log('name: bob'), selected: false },
    { name: 'sally', modified: DateTime.local(), onClick: () => console.log('name: sally'), selected: false }
  ]

  return (
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <React.Fragment>
          <Canvas>
            <UserList users={users}></UserList>
            <Example />
          </Canvas>
        </React.Fragment>
      </DndProvider>
    </Provider>
  )
};

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
