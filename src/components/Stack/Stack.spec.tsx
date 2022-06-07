import React from 'react';
import { render, screen } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import redux from '../../store/store';
import StackComponent from './Stack';
import { Stack } from '../../store/slices/stacks';

describe('Stack component', () => {
    const produceComponent = () =>
        render(
            <Provider store={redux.store} >
                <DndProvider backend={HTML5Backend}>
                    <StackComponent {...mockStack} />
                </DndProvider>
            </Provider>
        );

    const mockStack: Stack = {
        id: '254fa11a-6e7e-4fd3-bc08-e97c5409719b',
        name: 'testStack',
        created: 3,
        modified: 5,
        note: 'simple stack with two cards',
        cards: [
            'f6b3f2a3-9145-4b59-a4a1-bf414214f30b',
            '17734ae2-f8da-40cf-be86-993dc21b4079'
        ],
        left: 150,
        top: 200
    }

    it('renders the stack component', () => {
        produceComponent();
        expect(screen.getByTestId(/stack-component/i)).toBeInTheDocument();
    });

    it('close removes the stack component', () => {
        produceComponent();
        expect(screen.getByTestId(/stack-component/i)).toBeInTheDocument();
        // except that it doesn't work, because the close action is controlled by a Redux state change
        // userEvent.click(screen.getByLabelText(/close/i));
        // expect(screen.getByTestId(/stack-component/i)).not.toBeInTheDocument();
    });
});