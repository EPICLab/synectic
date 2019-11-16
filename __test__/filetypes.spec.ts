import mock from 'mock-fs';
import * as filetypes from '../src/containers/filetypes';

describe('filetypes', () => {
  beforeEach(() => {
    mock({ 'foo/config/filetypes.json': '[{"extensions": ["php", "phpt"], "handler": "Editor", "name": "PHP"}]' });
  });

  afterAll(() => {
    mock.restore();
  });

  it('filetypes.findExtensionType locates supported filetype metadata', async () => {
    const actual = await filetypes.findExtensionType('php', 'foo/config/filetypes.json');
    mock.restore();
    expect(actual).toMatchSnapshot();
  });

  it('filetypes.findExtensionType returns undefined if no filetype matches found', async () => {
    await expect(filetypes.findExtensionType('js', 'foo/config/filetypes.json')).resolves.toBeUndefined();
  });
});