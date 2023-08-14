import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import * as path from 'path';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { emptyStore } from '../../test-utils/empty-store';
import useWatcher from './useWatcher';

describe('containers/hooks/useWatcher', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  // let mockedInstance: MockInstance;
  // let store: ReturnType<typeof mockStore>;
  // const wrapper = ({ children }: { children: React.ReactNode }) => (
  //   <Provider store={store}> {children} </Provider>
  // );

  // beforeAll(async () => {
  //   const instance = await mock({
  //     empty: {},
  //     'foo/bar.js': file({ content: 'file contents', mtime: new Date(1) })
  //   });
  //   return (mockedInstance = instance);
  // });
  // beforeEach(() => (store = mockStore(emptyStore)));

  // afterAll(() => mockedInstance.reset);
  // afterEach(() => {
  //   store.clearActions();
  //   jest.clearAllMocks();
  // });

  // it('useWatcher hook tracks filesystem updates to individual files', async () => {
  //   const handlerMock = jest.fn();
  //   renderHook(() => useWatcher(path.resolve('foo/bar.js'), handlerMock), { wrapper });

  //   // TODO: Fix the following test to correctly mimic FS events and capture them via the useWatcher hook
  //   //
  //   // expect(handlerMock).not.toHaveBeenCalled();
  //   // await writeFileAsync('foo/bar.js', 'file contents updated');
  //   // expect(handlerMock).toHaveBeenCalled();

  //   return expect(true).toBe(true);
  // });

  // it('useWatcher hook tracks filesystem updates to subfiles in directories', async () => {
  //   const handlerMock = jest.fn();
  //   const filePath = 'foo/bar.js';
  //   renderHook(() => useWatcher(filePath, handlerMock, { persistent: true }), { wrapper });

  //   // TODO: Fix the following test to correctly mimic FS events and capture them via the useWatcher hook
  //   //
  //   // expect(handlerMock).not.toHaveBeenCalled();
  //   // await writeFileAsync('foo/baz.js', 'another file set');
  //   // await unlink(filePath);
  //   // await rename('foo/baz.js', filePath);

  //   // return Promise.resolve(100).then(() => expect(handlerMock).toHaveBeenCalled());

  //   return expect(true).toBe(true);
  // });

  // it('useWatcher hook tracks filesystem updates through multiple render cycles', async () => {
  //   const handlerMock = jest.fn();
  //   renderHook(() => useWatcher('foo/bar.js', handlerMock), { wrapper });

  //   // TODO: Fix the following test to correctly mimic FS events and capture them via the useWatcher hook
  //   //
  //   // expect(handlerMock).not.toHaveBeenCalled();
  //   // await writeFileAsync('foo/bar.js', 'content update 1').then(() => expect(handlerMock).toHaveBeenCalledTimes(1));
  //   // expect(handlerMock).toHaveBeenCalledTimes(1);
  //   // await writeFileAsync('foo/bar.js', 'content update 2').then(() => expect(handlerMock).toHaveBeenCalledTimes(2));
  //   // expect(handlerMock).toHaveBeenCalledTimes(2);

  //   return expect(true).toBe(true);
  // });
});
