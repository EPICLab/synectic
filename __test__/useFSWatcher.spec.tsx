import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import useFSWatcher from '../src/containers/hooks/useFSWatcher';
import { file, mock, MockInstance } from './__mocks__/mock-fs-promise';
import { Provider } from 'react-redux';
import { mockStore } from './__mocks__/reduxStoreMock';
import { testStore } from './__fixtures__/ReduxStore';
import { writeFileAsync } from '../src/containers/io';
import { rename, unlink } from 'fs-extra';

describe('containers/hooks/useFSWatcher', () => {
    let mockedInstance: MockInstance;
    let store: ReturnType<typeof mockStore>;
    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}> {children} </Provider>;

    beforeAll(async () => {
        const instance = await mock({
            'sampleUser/myRepo': {
                '.git': {
                    'config': {}
                },
                empty: {},
                'foo/bar.js': file({ content: 'file contents', mtime: new Date(1) }),
            }
        });
        return mockedInstance = instance;
    });
    beforeEach(() => store = mockStore(testStore));

    afterAll(() => mockedInstance.reset);
    afterEach(() => {
        store.clearActions();
        jest.clearAllMocks();
    });

    it('useFSWatcher hook tracks filesystem updates to individual files', async () => {
        const handlerMock = jest.fn();
        renderHook(() => useFSWatcher('sampleUser/myRepo/foo/bar.js', handlerMock), { wrapper });

        expect(handlerMock).not.toHaveBeenCalled();
        await writeFileAsync('sampleUser/myRepo/foo/bar.js', 'file contents updated');
        expect(handlerMock).toHaveBeenCalled();
    });

    it('useFSWatcher hook tracks filesystem updates to subfiles in directories', async () => {
        const handlerMock = jest.fn();
        const filePath = 'sampleUser/myRepo/foo/bar.js';
        renderHook(() => useFSWatcher(filePath, handlerMock, { persistent: true, recursive: true }), { wrapper });

        await writeFileAsync('sampleUser/myRepo/foo/baz.js', 'another file set');
        await unlink(filePath);
        await rename('sampleUser/myRepo/foo/baz.js', filePath);

        return Promise.resolve(100).then(() => expect(handlerMock).toHaveBeenCalled());
    });

    it('useFSWatcher hook tracks filesystem updates through multiple render cycles', async () => {
        const handlerMock = jest.fn();
        renderHook(() => useFSWatcher('sampleUser/myRepo/foo/bar.js', handlerMock), { wrapper });

        expect(handlerMock).not.toHaveBeenCalled();
        await writeFileAsync('sampleUser/myRepo/foo/bar.js', 'content update 1');
        expect(handlerMock).toHaveBeenCalledTimes(1);
        await writeFileAsync('sampleUser/myRepo/foo/bar.js', 'content update 2');
        expect(handlerMock).toHaveBeenCalledTimes(3);
    });
});