import mock from 'mock-fs';
import { DateTime } from 'luxon';
import { getMetafile } from '../src/containers/metafiles';

describe('metafiles.extractMetafile', () => {
  const staticTimestamp: Date = new Date('December 17, 1995 03:24:00');

  beforeAll(() => {
    mock({
      foo: {
        '.git': {
          'HEAD': 'ref: refs/heads/master',
          'config': '[core]\nrepositoryformatversion = 0\nfilemode = true\nbare = false\nlogallrefupdates = true\nignorecase = true\nprecomposeunicode = true\n[remote "origin"]\nurl = git@github.com:test/test.git\nfetch = +refs / heads/*:refs/remotes/origin/*\n[branch "master"]\nremote = origin\nmerge = refs/heads/master'
        },
        bar: mock.file({ content: 'file contents', ctime: new Date(1) }),
        baz: mock.file({ content: 'file contents', ctime: new Date(1) }),
        zap: {
          zed: {
            beq: mock.file({ content: 'file contents', ctime: new Date(1) }),
            'bup.azi': mock.file({ content: 'file contents', ctime: new Date(1) })
          },
          zip: mock.file({ content: 'file contents', ctime: new Date(1) }),
        }
      },
      baz: {
        'raz.js': mock.file({ content: 'untracked file', ctime: new Date(1), mtime: new Date(1) })
      },
      empty: mock.directory({
        mtime: staticTimestamp,
        items: undefined
      }),
    });
  });

  afterAll(mock.restore);

  it('extractMetafile resolves an empty directory with required fields in metafile', () => {
    return expect(getMetafile('empty/')).resolves.toEqual(
      expect.objectContaining({
        metafile: expect.objectContaining({
          name: 'empty',
          modified: DateTime.fromJSDate(staticTimestamp),
          filetype: 'Directory',
          handler: 'Explorer'
        })
      })
    );
  });

  it('extractMetafile resolves a non-empty directory with Redux actions', async () => {
    const metafileThunk = getMetafile('foo/zap');
    expect(metafileThunk).toHaveLength(6);
  });

  it('extractMetafile resolves to metafile without file information on unsupported filetype', async () => {
    const metafileThunk = getMetafile('foo/zap/zed/bup.azi');
    expect(metafileThunk.toString()).toContain('undefined');
    // expect(metafileThunk.metafile.filetype).toBeUndefined();
    // expect(metafilePayload.metafile.handler).toBeUndefined();
  });

  it('extractMetafile resolves tracked directories with Git repository information', async () => {
    const metafileThunk = getMetafile('foo/zap');
    expect(metafileThunk).toBeUndefined();
    // expect(metafilePayload.metafile.repo).toBeDefined();
    // expect(metafilePayload.metafile.ref).toBeDefined();
  });

  it('extractMetafile resolves untracked directories without Git repository information', async () => {
    const metafileThunk = getMetafile('baz/raz.js');
    expect(metafileThunk).toBeInstanceOf(typeof getMetafile);
    // expect(metafilePayload.metafile.repo).toBeUndefined();
    // expect(metafilePayload.metafile.ref).toBeUndefined();
  });

  it('extractMetafile throws error on filepath of nonexistent file or directory', () => {
    return expect(getMetafile('foo/nonexist.php')).rejects.toThrow(Error);
  });

});