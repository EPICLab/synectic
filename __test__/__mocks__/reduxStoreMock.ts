import { configureMockStore } from '@jedmao/redux-mock-store';
import thunk, { ThunkDispatch } from 'redux-thunk';

import { RootState, rootReducer } from '../../src/store/root';
import { Action } from '../../src/store/actions';

const middlewares = [thunk];
const createMockStore = configureMockStore<RootState, Action, ThunkDispatch<RootState, undefined, Action>>(middlewares);

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
const createState = (initialState: RootState) => (actions: Action[]) => actions.reduce(rootReducer, initialState);

/**
 * Creates a mocked Redux store for testing purposes. The resulting store can be interacted with using:
 *   * `store.dispatch()`: To dispatch Redux actions, thunks, and async thunks.
 *   * `store.getActions()`: Returns the actions list of the mocked store.
 *   * `store.getState()`: Returns the state of the mocked store.
 *   * `store.clearActions()`: Clears the stored actions.
 *   * `store.subscribe()`: Subscribes a listener to the store for specific actions.
 * @param initialState A JavaScript object containing an initial Redux store state that mimicks the shape of `RootState`.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const mockStore = (initialState: RootState) => createMockStore(createState(initialState));