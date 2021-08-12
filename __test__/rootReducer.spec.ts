import { repoRemoved } from '../src/store/slices/repos';
import { createMockStore } from './__mocks__/reduxStoreMock';
import { testStore } from './__fixtures__/ReduxStore';

describe('addCard', () => {
    const store = createMockStore(testStore);

    afterEach(() => store.clearActions());

    it('addCard kicks off multiple reducers', () => {
        expect(store.getState().repos.ids).toHaveLength(1);
        store.dispatch(repoRemoved('23'));
    });
});