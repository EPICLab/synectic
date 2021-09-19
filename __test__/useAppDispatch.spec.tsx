import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { useAppDispatch } from '../src/store/hooks';
import { metafileUpdated } from '../src/store/slices/metafiles';
import { testStore } from './__fixtures__/ReduxStore';
import { mockStore } from './__mocks__/reduxStoreMock';
import * as metafiles from '../src/containers/metafiles';

describe('store/hooks/useAppDispatch', () => {
    const store = mockStore(testStore);

    afterEach(() => {
        store.clearActions();
        jest.clearAllMocks();
    });

    it('useAppDispatch renders for metafileUpdated reducer', async () => {
        const metafile = await store.dispatch(metafiles.getMetafile({ id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c' })).unwrap();
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}> {children} </Provider>;
        const { result } = renderHook(() => useAppDispatch()(metafileUpdated({ ...metafile, content: 'new content' })), { wrapper });
        expect(result.current.payload.content).toBe('new content');
    });

});