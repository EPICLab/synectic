import mock from 'mock-fs';
import * as fileMetadata from '../src/containers/fileMetadata';

describe('fileMetadata', () => {
  beforeEach(() => {
    mock({ 'foo/config/filetypes.json': '[{"filetype": "PHP", "handler": "Editor", "extensions": ["php", "phpt"]},{"filetype": "JavaScript", "handler": "Editor", "extensions": ["js", "jsm"]}]' });
  });

  afterAll(() => {
    mock.restore();
  });

  it('pathToFileMetadata resolves file metadata for a supported filetype handler', async () => {
    const metadata = await fileMetadata.pathToFileMetadata('../examples/sample.php', 'foo/config/filetypes.json');
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Node
    expect(metadata).toMatchSnapshot();
  });

  it('pathToFileMetadata returns null metadata for an unsupported filetype', async () => {
    return fileMetadata.pathToFileMetadata('../examples/data.jswt', 'foo/config/filetypes.json')
    // mock.restore();
    // expect(metadata).toMatchSnapshot();
  });

  it('batchPathsToFileMetadata resolves array of all supported filetype handlers', async () => {
    const metadata = await fileMetadata.batchPathsToFileMetadata(['../examples/sample.php', '../examples/test.js'], 'foo/config/filetypes.json');
    mock.restore();
    expect(metadata).toMatchSnapshot();
  });

  it('batchPathsToFileMetadata resolves array of partially supported filetype handlers', async () => {
    const metadata = await fileMetadata.batchPathsToFileMetadata(['../examples/sample.php', '../examples/.config.jswt'], 'foo/config/filetypes.json');
    mock.restore();
    expect(metadata).toMatchSnapshot();
  });
});