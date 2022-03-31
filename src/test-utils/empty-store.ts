import { RootState } from '../store/store';

export const emptyStore: RootState = {
    stacks: {
        ids: [],
        entities: {}
    },
    cards: {
        ids: [],
        entities: {}
    },
    filetypes: {
        ids: [],
        entities: {}
    },
    metafiles: {
        ids: [],
        entities: {}
    },
    cached: {
        ids: [],
        entities: {}
    },
    repos: {
        ids: [],
        entities: {}
    },
    branches: {
        ids: [],
        entities: {}
    },
    modals: {
        ids: [],
        entities: {}
    }
}