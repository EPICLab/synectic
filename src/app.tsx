import React from 'react';
import ReactDOM from 'react-dom';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import Example from './components/Example';
import Canvas from './presentational-components/Canvas';
import UserList from './components/UserList';
import { DateTime } from 'luxon';
import './assets/style.css';

const App = (): JSX.Element => {
  const users = [
    { name: 'bob', modified: DateTime.local(), onClick: () => console.log('name: bob'), selected: false },
    { name: 'sally', modified: DateTime.local(), onClick: () => console.log('name: sally'), selected: false }
  ]

  return (
    <DndProvider backend={HTML5Backend}>
      <React.Fragment>
        <Canvas>
          <UserList users={users}></UserList>
          <Example />
        </Canvas>
      </React.Fragment>
    </DndProvider>
  )
};

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
