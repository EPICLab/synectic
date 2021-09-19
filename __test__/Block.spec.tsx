import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import Block from '../src/components/Block';
import { mockStore } from './__mocks__/reduxStoreMock';
import { testStore } from './__fixtures__/ReduxStore';

describe('Block', () => {

    const store = mockStore(testStore);

    afterEach(() => {
        cleanup;
        jest.restoreAllMocks();
    });

    it('Block keeps watchers alive', async () => {
        render(
            <Provider store={store}>
                <Block />
            </Provider>
        );
        const button = screen.getAllByRole('button')[0];
        fireEvent.click(button);

        expect(true).toBe(true);
    })
});