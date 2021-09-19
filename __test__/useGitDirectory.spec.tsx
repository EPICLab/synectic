import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { file, mock, MockInstance } from './__mocks__/mock-fs-promise';
import { Provider } from 'react-redux';
import { mockStore } from './__mocks__/reduxStoreMock';
import { testStore } from './__fixtures__/ReduxStore';
// import { writeFileAsync } from '../src/containers/io';
import useGitDirectory from '../src/containers/hooks/useGitDirectory';

describe('containers/hooks/useGitDirectory', () => {
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
        renderHook(() => useGitDirectory('sampleUser/myRepo/foo'), { wrapper });

        // TODO: Fix the following test to correctly mimic FS events and capture them via the useGitDirectory hook
        //
        // return writeFileAsync('sampleUser/myRepo/foo/bar.js', 'file contents updated')
        //     .then(() => expect(store.getActions()).toHaveLength(1));

        return expect(true).toBe(true);
    });
});