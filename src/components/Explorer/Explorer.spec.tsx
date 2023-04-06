import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import redux from '../../store/store';
import Explorer from './Explorer';

describe('Explorer component', () => {
    const produceComponent = () =>
        render(
            <Provider store={redux.store} >
                <DndProvider backend={HTML5Backend}>
                    <Explorer metafileId='3' />
                </DndProvider>
            </Provider>
        );

    it('renders the explorer card component', () => {
        produceComponent();
        expect(screen.getByTestId(/explorer-component/i)).toBeInTheDocument();
    });
});