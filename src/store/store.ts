import { configureStore } from '@reduxjs/toolkit';
import canvasReducer from './slices/canvas';
import cardsReducer from './slices/cards';
import filetypesReducer from './slices/filetypes';
import stacksReducer from './slices/stacks';
import metafilesReducer from './slices/metafiles';
import reposReducer from './slices/repos';
import modalsReducer from './slices/modals';

const store = configureStore({
    reducer: {
        canvas: canvasReducer,
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