import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import redux from '../../store/store';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Canvas from './Canvas';

describe('Canvas component', () => {

    const produceComponent = () =>
        render(
            <Provider store={redux.store} >
                <DndProvider backend={HTML5Backend}>
                    <Canvas />
                </DndProvider>
            </Provider>
        );

    it('renders the canvas component', () => {
        produceComponent();
        expect(screen.getByTestId(/canvas-component/i)).toBeInTheDocument();
    });

});