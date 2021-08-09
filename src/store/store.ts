import { configureStore } from '@reduxjs/toolkit';
import stacksReducer from './slices/stacks';
import cardsReducer from './slices/cards';
import filetypesReducer from './slices/filetypes';
import metafilesReducer from './slices/metafiles';
import reposReducer from './slices/repos';
import modalsReducer from './slices/modals';

const store = configureStore({
    reducer: {
        stacks: stacksReducer,
        cards: cardsReducer,
        filetypes: filetypesReducer,
        metafiles: metafilesReducer,
        repos: reposReducer,
        modals: modalsReducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;