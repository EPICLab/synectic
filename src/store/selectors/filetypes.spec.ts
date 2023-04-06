import { emptyStore } from '../../test-utils/empty-store';
import { mockStore } from '../../test-utils/mock-store';
import { Filetype, filetypeAdded, filetypeRemoved } from '../slices/filetypes';
import filetypeSelectors from './filetypes';

const mockedFiletype1: Filetype = {
    id: 'eb5d332e-61a1-422d-aeba-48186d9f79f3',
    filetype: 'JavaScript',
    handler: 'Editor',
    extensions: ['js', 'jsm']
};

const mockedFiletype2: Filetype = {
    id: '78aa4b01-ce6e-3161-4671-b0019de5c375',
    filetype: 'Directory',
    handler: 'Explorer',
    extensions: []
};

const mockedFiletype3: Filetype = {
    id: '0b743dd5-2559-4f03-8c02-0f67676e906a',
    filetype: 'Text',
    handler: 'Editor',
    extensions: ['txt']
};

describe('filetypeSelectors', () => {
    const store = mockStore(emptyStore);

    beforeEach(async () => {
        store.dispatch(filetypeAdded(mockedFiletype1));
        store.dispatch(filetypeAdded(mockedFiletype2));
        store.dispatch(filetypeAdded(mockedFiletype3));
    });

    afterEach(() => {
        store.clearActions();
    });

    it('selectByFiletype caches on filetype and recomputes when Filetype entities change', async () => {
        filetypeSelectors.selectByFiletype.resetRecomputations();

        filetypeSelectors.selectByFiletype(store.getState(), mockedFiletype1.filetype);
        store.dispatch(filetypeRemoved(mockedFiletype1.id));
        filetypeSelectors.selectByFiletype(store.getState(), mockedFiletype1.filetype);
        filetypeSelectors.selectByFiletype(store.getState(), mockedFiletype2.filetype);
        filetypeSelectors.selectByFiletype(store.getState(), mockedFiletype1.filetype); // cached
        return expect(filetypeSelectors.selectByFiletype.recomputations()).toBe(3);
    });

    it('selectByHandler caches on handler and recomputes when Filetype entities change', async () => {
        filetypeSelectors.selectByHandler.resetRecomputations();

        filetypeSelectors.selectByHandler(store.getState(), mockedFiletype1.handler);
        store.dispatch(filetypeRemoved(mockedFiletype1.id));
        filetypeSelectors.selectByHandler(store.getState(), mockedFiletype1.handler);
        filetypeSelectors.selectByHandler(store.getState(), mockedFiletype2.handler);
        filetypeSelectors.selectByHandler(store.getState(), mockedFiletype1.handler); // cached
        return expect(filetypeSelectors.selectByHandler.recomputations()).toBe(3);
    });

    it('selectByExtension caches on extension and recomputes when Filetype entities change', async () => {
        filetypeSelectors.selectByExtension.resetRecomputations();

        filetypeSelectors.selectByExtension(store.getState(), 'js');
        store.dispatch(filetypeRemoved(mockedFiletype1.id));
        filetypeSelectors.selectByExtension(store.getState(), 'js');
        filetypeSelectors.selectByExtension(store.getState(), 'txt');
        filetypeSelectors.selectByExtension(store.getState(), 'js'); // cached
        return expect(filetypeSelectors.selectByExtension.recomputations()).toBe(3);
    });

});