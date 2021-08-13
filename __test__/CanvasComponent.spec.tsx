// import React from 'react';
// import { Provider } from 'react-redux';
// import { cleanup, render, act, screen } from '@testing-library/react';
// import { wrapWithTestBackend } from 'react-dnd-test-utils';
// import * as path from 'path';
// import { homedir } from 'os';

// import CanvasComponent from '../src/components/CanvasComponent';
// import { mockStore, extractFieldArray } from './__mocks__/reduxStoreMock';
// import { testStore } from './__fixtures__/ReduxStore';
// import { fullCanvas } from './__fixtures__/Canvas';
// import { flattenArray } from '../src/containers/flatten';
import type { MockInstance } from './__mocks__/mock-fs-promise';
import { mock, file } from './__mocks__/mock-fs-promise';
// import endent from 'endent';
import * as io from '../src/containers/io';

// const store = mockStore(testStore);

describe('CanvasComponent', () => {

  let mockedInstance: MockInstance;

    beforeAll(async () => {
        const instance = await mock({
            foo: {
                bar: file({
                    content: 'file-content',
                    mtime: new Date(1)
                })
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('extractStats to extract relevant file information from valid path', async () => {
        expect.assertions(1);
        await expect(io.extractStats('foo/bar')).resolves.toHaveProperty('mtime', new Date(1));
    });

});

// describe('CanvasComponent', () => {
//   let mockedInstance: MockInstance;

//   // mocks for git config are required; ReduxStore fixture contains MergeDialog components which check for config values
//   beforeAll(async () => {
//     const instance = await mock({
//       'foo': {},
//       [path.join(homedir(), '.gitconfig')]: file({
//         content: endent`[user]
//   name = Sandy Updates
//   email = supdate@oregonstate.edu
// [core]
//   editor = vim
//   whitespace = fix,-indent-with-non-tab,trailing-space,cr-at-eol`,
//       }),
//       '.git/config': file({
//         content: endent`[user]
//   name = Bobby Tables
//   email = bdrop@oregonstate.edu
// [credential]
//   helper = osxkeychain
// [pull]
//   rebase = true
// [alias]
//   last = log -1 HEAD`,
//       }),
//     });
//     return mockedInstance = instance;
//   });
  
//   afterAll(() => mockedInstance.reset());

//   afterEach(() => {
//     cleanup;
//     jest.clearAllMocks();
//   });

//   it('Canvas renders correctly', async () => {
//     await act(async () => {
//       const [WrappedComponent] = wrapWithTestBackend(CanvasComponent);
//       render(
//         <Provider store={store}>
//           <WrappedComponent {...fullCanvas} />
//         </Provider>
//       );
//       expect(screen.getByTestId('canvas-component')).toBeInTheDocument();
//     })
//   });

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

// });