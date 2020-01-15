import mock from 'mock-fs';
import isUUID from 'validator/lib/isUUID';
import { DateTime } from 'luxon';

import { importFiletypes, loadCard } from '../src/containers/handlers';
import { ActionKeys } from '../src/store/actions';
import { Metafile } from '../src/types';

const mockedMetafile: Metafile = {
  id: '8',
  name: 'data.php',
  path: 'foo/data.php',
  filetype: 'PHP',
  handler: 'Editor',
  modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
  repo: null,
  ref: null,
  content: 'sample data for supported filetype'
};

beforeEach(() => {
  mock({
    'foo/config/filetypes.json': '[{"filetype": "PHP", "handler": "Editor", "extensions": ["php", "phpt"]}]',
    'foo/data.php': 'sample data for supported filetype',
    'foo/data.azi': 'sample data for unsupported filetype'
  });
});

afterEach(mock.restore);

describe('handlers.importFiletypes', () => {
  const trueFiletypesPath = 'foo/config/filetypes.json';
  const falseFiletypesPath = 'bar/config/filetypes.json';

  it('importFiletypes returns Redux actions on valid filetypes.json file', async () => {
    const filetypes = await importFiletypes(trueFiletypesPath);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(filetypes).toHaveLength(1);
    expect(filetypes[0].type).toBe(ActionKeys.ADD_FILETYPE);
  });

  it('importFiletypes throws error on missing filetypes.json file', async () => {
    return expect(importFiletypes(falseFiletypesPath)).rejects.toThrow(Error);
  });
});

describe('handlers.loadCard', () => {
  it('loadCard returns Redux action with new Card based on metafile', () => {
    const card = loadCard(mockedMetafile);
    expect(card.type).toBe(ActionKeys.ADD_CARD);
    expect(isUUID(card.id, 4)).toBe(true);
  });
});