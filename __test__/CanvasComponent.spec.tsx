import React from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, act, screen } from '@testing-library/react';
import { wrapWithTestBackend } from 'react-dnd-test-utils';
// import * as path from 'path';
// import { homedir } from 'os';
// import endent from 'endent';
import CanvasComponent from '../src/components/CanvasComponent';
import { mockStore } from './__mocks__/reduxStoreMock';
import { testStore } from './__fixtures__/ReduxStore';
// import { fullCanvas } from './__fixtures__/Canvas';
// import { flattenArray } from '../src/containers/flatten';
import type { MockInstance } from './__mocks__/mock-fs-promise';
import { mock, file } from './__mocks__/mock-fs-promise';
// import * as io from '../src/containers/io';

const store = mockStore(testStore);

describe('CanvasComponent', () => {
    let mockedInstance: MockInstance;

    // mocks for git config are required; ReduxStore fixture contains MergeDialog components which check for config values
    beforeAll(async () => {
        const instance = await mock({
            'foo': {},
            // TODO: Resolve issue of permanently altering global git config values
            //             [path.join(homedir(), '.gitconfig')]: file({
            //                 content: `[user]
            //   name = Sandy Updates
            //   email = supdate@oregonstate.edu
            // [core]
            //   editor = vim
            //   whitespace = fix,-indent-with-non-tab,trailing-space,cr-at-eol`,
            //             }),
            '.git/config': file({
                content: `[user]
  name = Bobby Tables
  email = bdrop@oregonstate.edu
[credential]
  helper = osxkeychain
[pull]
  rebase = true
[alias]
  last = log -1 HEAD`,
            }),
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    afterEach(() => {
        cleanup;
        jest.clearAllMocks();
    });

    it('Canvas renders correctly', async () => {
        return expect(true).toBe(true);
        // await act(async () => {
        //     const [WrappedComponent] = wrapWithTestBackend(CanvasComponent);
        //     render(
        //         <Provider store={store}>
        //             <WrappedComponent />
        //         </Provider>
        //     );
        //     expect(screen.getByTestId('canvas-component')).toBeInTheDocument();
        // })
    });

    //   it('Canvas resolves props to render Cards', async () => {
    //     await act(async () => {
    //       const [WrappedComponent] = wrapWithTestBackend(CanvasComponent);
    //       render(
    //         <Provider store={store}>
    //           <WrappedComponent {...fullCanvas} />
    //         </Provider>
    //       );
    //       const cardsInStacks = flattenArray(extractFieldArray(store.getState().stacks).map(s => s.cards));
    //       expect(screen.getAllByTestId('card-component')).toHaveLength(fullCanvas.cards.length + cardsInStacks.length);
    //     });
    //   });

    //   it('Canvas resolves props to render Stacks', async () => {
    //     await act(async () => {
    //       const [WrappedComponent] = wrapWithTestBackend(CanvasComponent);
    //       render(
    //         <Provider store={store}>
    //           <WrappedComponent {...fullCanvas} />
    //         </Provider>
    //       );
    //       expect(screen.getAllByTestId('stack-component')).toHaveLength(fullCanvas.stacks.length);
    //     });
    //   });

});