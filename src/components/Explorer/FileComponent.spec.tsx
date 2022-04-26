import React from 'react';
import { cleanup, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { Provider } from 'react-redux';
import TreeView from '@material-ui/lab/TreeView';
import { DateTime } from 'luxon';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { emptyStore } from '../../test-utils/empty-store';
import { mockStore } from '../../test-utils/mock-store';
import { FilebasedMetafile, metafileAdded } from '../../store/slices/metafiles';
import FileComponent from './FileComponent';

const mockedMetafile: FilebasedMetafile = {
    id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
    name: 'bar.js',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Javascript',
    path: 'foo/bar.js',
    state: 'unmodified'
};

describe('FileComponent', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeAll(async () => {
        store.dispatch(metafileAdded(mockedMetafile));
        const instance = await mock({
            'foo/bar.js': file({ content: 'file contents', mtime: new Date(1) })
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    afterEach(() => {
        cleanup;
        store.clearActions();
    });

    it('FileComponent initially renders with loading indicator', () => {
        render(
            <Provider store={store} >
                <TreeView><FileComponent metafile={mockedMetafile.id} /> </TreeView>
            </Provider>
        );
        expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
        expect(screen.queryByText('bar.js')).not.toBeInTheDocument();
    });

    it('FileComponent eventually renders file information', async () => {
        render(
            <Provider store={store}>
                <TreeView><FileComponent metafile={mockedMetafile.id} /></TreeView>
            </Provider>
        );
        expect(screen.queryByText('bar.js')).not.toBeInTheDocument();
        await waitForElementToBeRemoved(() => screen.queryByLabelText(/loading/i));
        expect(screen.getByText('bar.js')).toBeInTheDocument();
    });

});