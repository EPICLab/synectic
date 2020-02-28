// import configureStore from 'redux-mock-store';
import { Metadir } from '../src/types';
import { v4 } from 'uuid';
import { Actions, ActionKeys } from '../src/store/actions';
// import renderer from 'react-test-renderer';
// import { Provider } from 'react-redux';
// import React from 'react';

// const mockStore = configureStore([]);

describe('FileExplorerComponent', () => {
    // let store;
    // let component;

    const metadir: Metadir = {
        id: v4(),
        name: 'foo',
        path: '/foo',
        expanded: true,
        containsDir: [],
        containsFile: [],
    };

    const action: Actions = {
        type: ActionKeys.ADD_FE,
        id: metadir.id,
        metadir: metadir,
    };

    console.log(action);

    // beforeEach(() => {
    //     store = mockStore({
    //         myState: action,
    //     });
    // });

    // component = renderer.create(
    //     <Provider store={store}>

    //     </Provider>
    // );
});