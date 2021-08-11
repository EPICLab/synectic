import * as handlers from '../src/containers/handlers';
import { testStore } from './__fixtures__/ReduxStore';
import { mock, MockInstance } from './__mocks__/mock-fs-promise';
import { createMockStore } from './__mocks__/reduxStoreMock';

let mockedInstance: MockInstance;

beforeAll(async () => {
  const instance = await mock({
    'foo/config/filetypes.json': '[{"filetype": "PHP", "handler": "Editor", "extensions": ["php", "phpt"]}]',
    'foo/data.php': 'sample data for supported filetype',
    'foo/data.azi': 'sample data for unsupported filetype'
  });
  return mockedInstance = instance;
});
afterAll(() => mockedInstance.reset());

describe('handlers.importFiletypes', () => {
  const store = createMockStore(testStore);
    
  it('importFiletypes returns Redux actions for adding filetypes', async () => {
    const filetypes = handlers.importFiletypes();
    // mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(filetypes.length > 1).toBe(true);
    await store.dispatch(filetypes);
    expect(store.getActions()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'filetypes/filetypeAdded'
          })
        ])
      );
  });
});