import { Provider } from 'react-redux';
import redux from './store/store';
import { ErrorBoundary } from 'react-error-boundary';
import { styled } from '@mui/material';
import Canvas from './components/Canvas';

const Error = styled('div')(() => ({
  color: '#FF0000'
}));

const App = () => {
  // useEffect(() => {
  //   redux.store.dispatch(importFiletypes(filetypesJson as Omit<Filetype, 'id'>[])); // load all supported filetype handlers into Redux store
  // }, []); // run the effect only once; after the first render

  return (
    <Provider store={redux.store}>
      <ErrorBoundary fallback={<Error>💥Canvas Error💥</Error>}>
        <Canvas />
      </ErrorBoundary>
    </Provider>
  );
};

export default App;
