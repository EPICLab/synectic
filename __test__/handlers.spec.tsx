import { DateTime } from 'luxon';
import * as handlers from '../src/containers/handlers';
import { Metafile } from '../src/types';
import { testStore } from './__fixtures__/ReduxStore';
import { mock, MockInstance } from './__mocks__/mock-fs-promise';
import { mockStore } from './__mocks__/reduxStoreMock';

let mockedInstance: MockInstance;
const store = mockStore(testStore);

beforeAll(async () => {
  const instance = await mock({
    'foo/data.php': 'sample data for supported filetype',
    'foo/data.azi': 'sample data for unsupported filetype',
    'foo/example.ts': 'sample data tied to a metafile'
  });
  return mockedInstance = instance;
});
afterAll(() => mockedInstance.reset());
afterEach(() => store.clearActions());

describe('handlers.importFiletypes', () => {

  it('importFiletypes resolves filetypes from config file', async () => {
    await store.dispatch(handlers.importFiletypes());
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'filetypes/filetypeAdded'
        })
      ])
    );
  });

  it('resolveHandler returns Filetype from valid path', async () => {
    await store.dispatch(handlers.importFiletypes());
    expect(await store.dispatch(handlers.resolveHandler('foo/data.php')).unwrap()).toEqual(
      expect.objectContaining({
        filetype: 'PHP',
        handler: 'Editor'
      })
    )
  });

  it('resolveHandler returns Text on unsupported filetype', async () => {
    await store.dispatch(handlers.importFiletypes());
    expect(await store.dispatch(handlers.resolveHandler('foo/data.azi')).unwrap()).toEqual(
      expect.objectContaining({
        filetype: 'Text',
        handler: 'Editor'
      })
    )
  });

  it('loadCard resolves new card on valid filepath', async () => {
    await store.dispatch(handlers.loadCard({ filepath: 'foo/data.php' }));
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'handlers/loadCard/fulfilled'
        })
      ])
    )
  });

  it('loadCard resolves new card on valid metafile', async () => {
    const metafile: Metafile = {
      id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
      name: 'example.ts',
      path: 'foo/example.ts',
      modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
      content: 'sample data tied to a metafile'
    }
    await store.dispatch(handlers.loadCard({ metafile: metafile }));
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'handlers/loadCard/fulfilled'
        })
      ])
    )
  });
});