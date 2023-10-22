/// <reference types="vite-plugin-svgr/client" />

import Logo from '../assets/logo.svg?react';
import ElectronVersion from './components/ElectronVersions';
import ReactiveCounter from './components/ReactiveCounter';
import ReactiveHash from './components/ReactiveHash';

const App = () => {
  const version = import.meta.env.VITE_APP_VERSION;

  return (
    <>
      <Logo />
      <p>Hello from Synectic v{version}</p>
      <ReactiveCounter />
      <ReactiveHash />
      <ElectronVersion />
    </>
  );
};
export default App;
