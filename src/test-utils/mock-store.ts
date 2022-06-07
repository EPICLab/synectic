import { AnyAction } from 'redux';
import { getDefaultMiddleware } from '@reduxjs/toolkit';
import configureMockStore from 'redux-mock-store';
import { RootState, AppDispatch, rootReducer } from '../store/store';
import { listenerMiddleware } from '../store/listenerMiddleware';

const middlewares = (withListeners = false) => {
    const defaultMiddlewares = getDefaultMiddleware({ serializableCheck: false, immutableCheck: false });
    return withListeners ? defaultMiddlewares.concat([listenerMiddleware.middleware]) : defaultMiddlewares;
}
const createMockStore = (withListeners = false) => configureMockStore<RootState, AppDispatch>(middlewares(withListeners));

/** 
 * The mocked Redux store does not execute any reducers, and therefore `getActions()` only provides the unexecuted actions 
 * without applying their updates on the state. In order to handle Thunk Action Creators that rely on `getState()` for 
 * controlling behavior, we must have actions apply their updates to the mocked store. Therefore, we must inject a reducer 
 * step into the state of the mocked store using a customized initial state.
 * 
 * For more information, see:
 *   * https://github.com/reduxjs/redux-mock-store/issues/71
 *   * https://github.com/reduxjs/redux-mock-store/issues/71#issuecomment-515209822
 */
export const createState = (initialState: RootState) => (actions: AnyAction[]): RootState =>
    actions.reduce((state, action) => rootReducer(state, action), initialState);

/**
 * Creates a mocked Redux store for testing purposes. The resulting store can be interacted with using:
 *   * `store.dispatch()`: To dispatch Redux actions, thunks, and async thunks.
 *   * `store.getActions()`: Returns the actions list of the mocked store.
 *   * `store.getState()`: Returns the state of the mocked store.
 *   * `store.clearActions()`: Clears the stored actions.
 *   * `store.subscribe()`: Subscribes a listener to the store for specific actions.
 * @param initialState A JavaScript object containing an initial Redux store state that mimicks the shape of `RootState`.
 * @param withListeners Option for including possibly asynchronous listeners from createListenerMiddleware API.
 */
export const mockStore = (initialState: RootState, withListeners = false) => createMockStore(withListeners)(createState(initialState));