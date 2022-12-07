import React from 'react';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import { mockStore } from '../../test-utils/mock-store';
import { emptyStore } from '../../test-utils/empty-store';
import Editor from './Editor';
import { DateTime } from 'luxon';
import { FilebasedMetafile, metafileAdded } from '../../store/slices/metafiles';
import { mock, MockInstance } from '../../test-utils/mock-fs';

const metafile: FilebasedMetafile = {
    id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
    name: 'example.ts',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Typescript',
    flags: [],
    path: 'foo/example.ts',
    state: 'unmodified',
    content: 'const rand = Math.floor(Math.random() * 6) + 1;',
    repo: '23',
    branch: '503',
    status: 'unmodified',
    conflicts: []
};

describe('Editor component', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeAll(async () => {
        store.dispatch(metafileAdded(metafile));
        const instance = await mock({
            foo: {
                'example.ts': 'const rand = Math.floor(Math.random() * 6) + 1;',
                '.git': {
                    config: '',
                    HEAD: 'refs/heads/main',
                    refs: {
                        'remotes/origin/HEAD': 'ref: refs/remotes/origin/main'
                    }
                }
            },
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('Editor renders in the DOM', () => {
        render(
            <Provider store={store}>
                <Editor metafileId={metafile.id} />
            </Provider>
        );

        // using DOM selector method instead of RTL
        // eslint-disable-next-line testing-library/no-node-access
        const editor = document.querySelector('.ace_editor');

        expect(editor).toBeInTheDocument();
    });

    it('Editor tracks content updates', () => {
        render(
            <Provider store={store}>
                <Editor metafileId={metafile.id} />
            </Provider>
        );
        const textBox = screen.queryByRole('textbox');
        expect(textBox).toHaveValue('');

        // update the content of the editor
        if (textBox) {
            fireEvent.focus(textBox);
            fireEvent.change(textBox, { target: { value: 'var foo = 5;' } });
        }

        expect(screen.queryByRole('textbox')).toHaveValue('var foo = 5;');
    });
});