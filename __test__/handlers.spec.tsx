import mock from 'mock-fs';

import * as handlers from '../src/containers/handlers';
import { ActionKeys } from '../src/store/actions';

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
    const filetypes = await handlers.importFiletypes();
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(filetypes.length > 1).toBe(true);
    expect(filetypes[0].type).toBe(ActionKeys.ADD_FILETYPE);
  });
});
