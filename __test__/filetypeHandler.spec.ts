import mock from 'mock-fs';
import * as path from 'path';
import * as filetypeHandler from '../src/containers/filetypeHandler';

describe('filetypeHandler', () => {
  const trueFiletypesPath = 'foo/config/filetypes.json';
  const falseFiletypesPath = 'bar/config/filetypes.json';

  beforeEach(() => {
    mock({ 'foo/config/filetypes.json': '[{"extensions": ["php", "phpt"], "handler": "Editor", "filetype": "PHP"}]' });
  });

  afterAll(() => {
    mock.restore();
  });

  it('findByExtension locates supported filetype handler', async () => {
    const handler = await filetypeHandler.findByExtension('php', trueFiletypesPath)
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Node
    expect(handler).toMatchSnapshot();
  });

  it('findByExtension returns undefined if no filetype matches found', async () => {
    return expect(filetypeHandler.findByExtension('js', trueFiletypesPath)).rejects
      .toEqual(new Error(`Unsupported filetype extension 'js'`));
  });

  it('findByExtension catches error on missing filetypes.json file', async () => {
    return expect(filetypeHandler.findByExtension('js', falseFiletypesPath)).rejects
      .toEqual(new Error(`ENOENT, no such file or directory '${path.resolve(falseFiletypesPath)}'`));
  });
});