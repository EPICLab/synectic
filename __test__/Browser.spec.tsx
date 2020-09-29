import '@testing-library/jest-dom';
import { DateTime } from 'luxon';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { v4 } from 'uuid';
import userEvent from '@testing-library/user-event';

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

    it('BrowserComponent allows the user to enter/edit a URL', async () => {
        render(<BrowserComponentContext />);
        const textBox = screen.getByRole('textbox') as HTMLInputElement;

        expect(textBox.value).toBe("https://epiclab.github.io/");

        // Type URL into text box
        userEvent.clear(screen.getByRole('textbox'));
        await userEvent.type(screen.getByRole('textbox'), 'https://google.com');

        // Hit Enter button
        fireEvent.keyDown(textBox, { key: 'Enter', keyCode: 13, which: 13 });

        expect(textBox.value).toBe("https://google.com");
    });

    it('BrowserComponent allows the user to navigate backwards and forwards in history', async () => {
        render(<BrowserComponentContext />);
        const backButton = screen.getAllByRole('button')[0];
        const forwardButton = screen.getAllByRole('button')[1];
        const textBox = screen.getByRole('textbox') as HTMLInputElement;

        expect(textBox.value).toBe("https://epiclab.github.io/");
        textBox.focus();

        // Type URL into text box
        userEvent.clear(screen.getByRole('textbox'));
        await userEvent.type(screen.getByRole('textbox'), 'https://google.com');

        // Press Enter key
        fireEvent.keyDown(textBox, { key: 'Enter', keyCode: 13, which: 13 });
        expect(screen.getByRole('textbox')).toHaveValue('https://google.com');

        // Go back in history
        fireEvent.click(backButton);
        expect(textBox.value).toBe("https://epiclab.github.io/");

        // Go forward in history
        fireEvent.click(forwardButton);
        expect(textBox.value).toBe("https://google.com/");
    });

    it('BrowserComponent does not change the page URL when the refresh button is clicked', async () => {
        render(<BrowserComponentContext />);
        const textBox = screen.getByRole('textbox') as HTMLInputElement;
        const refreshButton = screen.getAllByRole('button')[2];

        expect(textBox.value).toBe("https://epiclab.github.io/");
        fireEvent.click(refreshButton);
        expect(textBox.value).toBe("https://epiclab.github.io/");

        textBox.focus();

        // Type URL into text box
        userEvent.clear(screen.getByRole('textbox'));
        await userEvent.type(screen.getByRole('textbox'), 'https://google.com');

        // Press Enter key
        fireEvent.keyDown(textBox, { key: 'Enter', keyCode: 13, which: 13 });

        expect(textBox.value).toBe("https://google.com");
        fireEvent.click(refreshButton);
        expect(textBox.value).toBe("https://google.com");
    });
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
    //     metafiles: {
    //         199: {
    //             id: '199',
    //             name: 'Browser',
    //             handler: 'Browser',
    //             modified: DateTime.fromISO('2019-11-19T19:19:47.572-08:00')
    //         },
    //     },
    //     repos: {},
    //     errors: {}
    // });

    // const BrowserButtonContext = wrapInReduxContext(BrowserButton, store);

    // it('BrowserButton displays BrowserComponent when clicked', async () => {
    //     render(<BrowserButtonContext />);
    //     // expect(screen.queryByText(/URL/i)).toBeNull();

    //     // const button = screen.queryByText(/Browser\.\.\./i);
    //     const button = screen.getByRole('button');

    //     if (button) fireEvent.click(button);

    //     const card = await screen.findByText("Browser");

    //     screen.debug(card);

    //     // expect(screen.queryByText(/URL/i)).not.toBeNull();
    //     // expect(screen.queryByText(/URL/i)).toBeInTheDocument();
    //     // process.stdout.write(`Actions:\n${JSON.stringify(store.getActions(), null, 2)}\n`);
    //     // expect(extractFieldArray(store.getState().cards)).toHaveLength(1);
    //     expect(true).toBe(true);
    // });
});