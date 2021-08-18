import React from 'react';
import Block from './components/Block';
import ReactDOM from 'react-dom';
import './index.css';

/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 */

const App = (): JSX.Element => {

  return (
        <Block />
  );
};

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
