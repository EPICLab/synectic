import mock from 'mock-fs';
import isUUID from 'validator/lib/isUUID';

import { extractMetafile } from '../src/containers/metafiles';
import { Filetype } from '../src/types';
import { ActionKeys } from '../src/store/actions';
import { DateTime } from 'luxon';

const mockedFiletypes: Filetype[] = [{ id: '3', filetype: 'PHP', handler: 'Editor', extensions: ['php', 'phpt'] }];

beforeEach(() => {
  mock({
    foo: {
      '.git': {
        'HEAD': 'ref: refs/heads/master',
        'config': '[core]\nrepositoryformatversion = 0\nfilemode = true\nbare = false\nlogallrefupdates = true\nignorecase = true\nprecomposeunicode = true\n[remote "origin"]\nurl = git@github.com:test/test.git\nfetch = +refs / heads/*:refs/remotes/origin/*\n[branch "master"]\nremote = origin\nmerge = refs/heads/master'
      },
      'data.php': mock.file({
        content: 'sample data for supported filetype',
        ctime: new Date(1),
        mtime: new Date(1)
      }),
      'data.azi': 'sample data for unsupported filetype'
    },
    'baz/raz.js': 'untracked file'
  });
});

afterEach(mock.restore);

describe('metafiles.extractMetafile', () => {
  it('extractMetafile returns ADD_METAFILE Redux action on existing file', async () => {
    const metafile = await extractMetafile('foo/data.php', mockedFiletypes);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(metafile.type).toBe(ActionKeys.ADD_METAFILE);
  });

  it('extractMetafile returns Redux action with baseline metafile information', async () => {
    const metafile = await extractMetafile('foo/data.php', mockedFiletypes);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(isUUID(metafile.metafile.id, 4)).toBe(true);
    expect(metafile.metafile.name).toBe('data.php');
    expect(metafile.metafile.path).toBe('foo/data.php');
  });

  it('extractMetafile returns Redux action with filetype information on supported filetype', async () => {
    const metafile = await extractMetafile('foo/data.php', mockedFiletypes);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(metafile.metafile.filetype).toBe('PHP');
    expect(metafile.metafile.handler).toBe('Editor');
  });

  it('extractMetafile returns Redux action with default filetype information on unsupported filetype', async () => {
    const metafile = await extractMetafile('foo/data.azi', mockedFiletypes);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(metafile.metafile.filetype).toBeUndefined();
    expect(metafile.metafile.handler).toBeUndefined();
  });

  it('extractMetafile returns Redux action with file stats on existing file', async () => {
    const metafile = await extractMetafile('foo/data.php', mockedFiletypes);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    const mtime = DateTime.fromJSDate(new Date(1));
    expect(metafile.metafile.modified).toMatchObject(mtime);
  });

  it('extractMetafile returns Redux action with Git information on tracked file', async () => {
    const metafile = await extractMetafile('foo/data.php', mockedFiletypes);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(metafile.metafile.repo).toBe('unchecked');
    expect(metafile.metafile.ref).toBe('master');
  });

  it('extractMetafile returns Redux action without Git information on untracked file', async () => {
    const metafile = await extractMetafile('baz/raz.js', mockedFiletypes);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(metafile.metafile.repo).toBeUndefined();
    expect(metafile.metafile.ref).toBeUndefined();
  });

  it('extractMetafile throws error on filepath of nonexistent file', async () => {
    return expect(extractMetafile('foo/nonexist.php', mockedFiletypes)).rejects.toThrow(Error);
  });
});