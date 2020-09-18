import '@testing-library/jest-dom';
import { DateTime } from 'luxon';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { v4 } from 'uuid';

import { BrowserComponent } from '../src/components/Browser';
import { mockStore } from './__mocks__/reduxStoreMock';
import { wrapInReduxContext } from './__mocks__/dndReduxMock';

describe('BrowserComponent', () => {
    const store = mockStore({
        canvas: {
            id: v4(),
            created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
            repos: [],
            cards: [],
            stacks: []
        },
        stacks: {},
        cards: {},
        filetypes: {},
        metafiles: {},
        repos: {},
        errors: {}
    });

    const BrowserComponentContext = wrapInReduxContext(BrowserComponent, store);

    it('BrowserComponent allows the user to enter/edit a URL', () => {
        render(<BrowserComponentContext />);
        const textBox = screen.getByRole('textbox');

        // Type guard so we can access .value from textBox (*.value doesn't exist in HTMLElement, but does in HTMLInputElement)
        if ((textBox instanceof HTMLInputElement)) {
            expect(textBox.value).toBe("https://epiclab.github.io/");

            // Enter file name into text box
            if (textBox) fireEvent.change(textBox, { target: { value: 'https://google.com' } });

            expect(textBox.value).toBe("https://google.com");
        }
    });

    //check that it actually changes the page somehow?

    // it('BrowserComponent allows the user to navigate back in history', () => {
    //     render(<BrowserComponentContext />);
    //     const backButton = screen.getAllByRole('button')[0];
    //     const textBox = screen.getByRole('textbox');

    //     screen.debug(backButton);

    //     // Type guard so we can access .value from textBox (*.value doesn't exist in HTMLElement, but does in HTMLInputElement)
    //     if ((textBox instanceof HTMLInputElement)) {
    //         // Enter file name into text box
    //         if (textBox) fireEvent.change(textBox, { target: { value: 'https://google.com' } });

    //         expect(textBox.value).toBe("https://google.com");

    //         fireEvent.click(backButton);

    //         expect(textBox.value).toBe("https://epiclab.github.io/");
    //     }
    // });

    //check that you can go forward

    //check refresh button

});

describe('BrowserButton', () => {
    // const store = mockStore({
    //     canvas: {
    //         id: v4(),
    //         created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
    //         repos: [],
    //         cards: [],
    //         stacks: []
    //     },
    //     stacks: {},
    //     cards: {},
    //     filetypes: {},
    //     metafiles: {},
    //     repos: {},
    //     errors: {}
    // });

    // const BrowserButtonContext = wrapInReduxContext(BrowserButton, store);

    // it('BrowserButton displays BrowserComponent when clicked', () => {
    //     render(<BrowserButtonContext />);
    //     expect(screen.queryByText(/URL/i)).toBeNull();

    //     const button = screen.queryByText(/Browser\.\.\./i);
    //     if (button) fireEvent.click(button);

    //     screen.debug();

    //     expect(screen.queryByText(/URL/i)).not.toBeNull();
    //     expect(screen.queryByText(/URL/i)).toBeInTheDocument();
    // });
});

