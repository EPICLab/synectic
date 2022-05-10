import { useCallback, useReducer } from 'react';

type HistoryState = {
    /** Array of previous URLs updated each time a new URL is visited. */
    past: URL[];
    /** Current URL. */
    present: URL;
    /** Array of "future" URLs if we go back (so that we can go forward). */
    future: URL[];
};

type HistoryAction = {
    type: 'GO',
    newPresent: URL
} | {
    type: 'CLEAR',
    initialPresent: URL
} | {
    type: 'BACK' | 'FORWARD'
}

// Initial state passed to useReducer
const initialState = {
    past: [],
    present: null,
    future: [],
};

// Reducer function to handle state changes based on action
const reducer = (state: HistoryState, action: HistoryAction) => {
    const { past, present, future } = state;

    switch (action.type) {
        case 'BACK': {
            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [present, ...future],
            };
        }
        case 'FORWARD': {
            const next = future[0];
            const newFuture = future.slice(1);

            return {
                past: [...past, present],
                present: next,
                future: newFuture,
            };
        }
        case 'GO': {
            const { newPresent } = action;

            if (newPresent === present) {
                return state;
            }
            return {
                past: [...past, present],
                present: newPresent,
                future: [],
            };
        }
        case 'CLEAR': {
            const { initialPresent } = action;

            return {
                ...initialState,
                present: initialPresent,
            };
        }
    }
};

// Hook
export const useHistory = (initialPresent: URL) => {
    const [state, dispatch] = useReducer(reducer, {
        ...initialState,
        present: initialPresent,
    });

    const canGoBack = state.past.length !== 0;
    const canGoForward = state.future.length !== 0;

    // All actions are memoized with useCallback to prevent unnecessary re-renders
    const goBack = useCallback(() => {
        if (canGoBack) {
            dispatch({ type: 'BACK' });
        }
    }, [canGoBack, dispatch]);

    const goForward = useCallback(() => {
        if (canGoForward) {
            dispatch({ type: 'FORWARD' });
        }
    }, [canGoForward, dispatch]);

    const set = useCallback(
        (newPresent: URL) => dispatch({ type: 'GO', newPresent }),
        [dispatch]
    );

    const clear = useCallback(() => dispatch({ type: 'CLEAR', initialPresent }),
        [dispatch, initialPresent]
    );

    return { state, set, goBack, goForward, clear, canGoBack, canGoForward };
};