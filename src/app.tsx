import React from 'react';
import ReactDOM from 'react-dom';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import Example from './components/Example';
import Canvas from './components/Canvas';

const App = (): JSX.Element => (
  <DndProvider backend={HTML5Backend}>
    <React.Fragment>
      <Canvas>
        <Example />
      </Canvas>
    </React.Fragment>
  </DndProvider>
);

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);

/**
import { CanvasComponent } from './components/Canvas';
import Button from '@material-ui/core/Button';
import { CheckboxWithLabel } from './checkboxWithLabel';
import Draggable from './components/Draggable';
 *
 *
<Button variant="contained" color="primary" onClick={(): void => console.log(`Clicked...`)}>
  Select...
</Button>
Reactor: <CheckboxWithLabel labelOn="Enabled" labelOff="Disabled"></CheckboxWithLabel>
 */
