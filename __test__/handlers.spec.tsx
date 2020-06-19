import mock from 'mock-fs';
import { DateTime } from 'luxon';

import { importFiletypes, loadStack } from '../src/containers/handlers';
import { ActionKeys } from '../src/store/actions';
import { Card } from '../src/types';

const card: Card = {
  id: 't829w0351',
  name: 'card1',
  type: 'Editor',
  related: ['84354571'],
  created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00'),
  modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00'),
  captured: false,
  left: 100, top: 50
}

beforeEach(() => {
  mock({
    'foo/config/filetypes.json': '[{"filetype": "PHP", "handler": "Editor", "extensions": ["php", "phpt"]}]',
    'foo/data.php': 'sample data for supported filetype',
    'foo/data.azi': 'sample data for unsupported filetype'
  });
});

afterEach(mock.restore);

describe('handlers.importFiletypes', () => {
  it('importFiletypes returns Redux actions for adding filetypes', async () => {
    const filetypes = await importFiletypes();
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(filetypes.length > 1).toBe(true);
    expect(filetypes[0].type).toBe(ActionKeys.ADD_FILETYPE);
  });
});

describe('handlers.loadStack', () => {
  it('loadStack returns Redux action with new Stack and updates to child Cards', () => {
    const actions = loadStack('testStack', [card], 'sample note');
    expect(actions).toHaveLength(2);
    expect(actions.map(a => a.type)).toStrictEqual([ActionKeys.ADD_STACK, ActionKeys.UPDATE_CARD]);
  });
});