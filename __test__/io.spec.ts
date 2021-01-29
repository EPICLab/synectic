import mock from 'mock-fs';
import * as fs from 'fs-extra';

import type { Filetype } from '../src/types';
import * as io from '../src/containers/io';

describe('io.extractStats', () => {

  beforeAll(() => {
    mock({
      foo: {
        bar: mock.file({
          content: 'file contents',
          ctime: new Date(1),
          mtime: new Date(1)
        })
      }
    });
  });

  afterAll(mock.restore);

  it('extractStats to extract relevant file information from valid path', async () => {
    return expect(io.extractStats('foo/bar')).resolves.toHaveProperty('ctime', new Date(1));
  });

  it('extractStats to return undefined from nonexistent path', async () => {
    return expect(io.extractStats('foo/baz')).resolves.toBeUndefined();
  });
});

describe('io.extractFilename', () => {
  it('extractFilename to extract filename from Linux/MacOS paths', () => {
    expect(io.extractFilename('/Users/foo/bar/module.d.ts')).toBe('module.d.ts');
    expect(io.extractFilename('./baz/webpack.config.js')).toBe('webpack.config.js');
    expect(io.extractFilename('../../baz/sample.c9search_results')).toBe('sample.c9search_results');
  });

  it('extractFilename to extract filename from Windows paths', () => {
    expect(io.extractFilename('C:\\Foo\\Bar\\Baz\\file.js')).toBe('file.js');
    expect(io.extractFilename('2018\\January.xlsx')).toBe('January.xlsx');
  });
});

describe('io.extractDirname', () => {
  it('extractDirname to extract dirname from Linux/MacOS paths', () => {
    expect(io.extractDirname('/Users/foo/bar/module.d.ts')).toBe('bar');
    expect(io.extractDirname('./baz/webpack.config.js')).toBe('baz');
    expect(io.extractDirname('../../baz/sample.c9search_results')).toBe('baz');
    expect(io.extractDirname('/Users/foo/bar/')).toBe('bar');
    expect(io.extractDirname('bar/')).toBe('bar');
    expect(io.extractDirname('/setup.cfg')).toBe('');
    expect(io.extractDirname('module.d.ts')).toBe('');
  });

  it('extractDirname to extract dirname from Windows paths', () => {
    expect(io.extractDirname('C:\\Foo\\Bar\\Baz\\file.js')).toBe('Baz');
    expect(io.extractDirname('2018\\January.xlsx')).toBe('2018');
    expect(io.extractDirname('C:\\Foo\\Bar\\Baz\\')).toBe('Baz');
  });

  it('extractDirname resolves malformed paths', () => {
    expect(io.extractDirname('')).toBe('');
    expect(io.extractDirname('/')).toBe('');
    expect(io.extractDirname(' /')).toBe(' ');
    expect(io.extractDirname('/ ')).toBe('');
  });
});

describe('io.extractExtension', () => {
  it('extractExtension to extract extension from filename', () => {
    expect(io.extractExtension('foo.js')).toBe('js');
    expect(io.extractExtension('bar.d.ts')).toBe('ts');
    expect(io.extractExtension('.htaccess')).toBe('htaccess');
  });

  it('extractExtension to extract extension from Linux/MacOS paths', () => {
    expect(io.extractExtension('/Users/foo/bar/module.d.ts')).toBe('ts');
    expect(io.extractExtension('./baz/webpack.config.js')).toBe('js');
    expect(io.extractExtension('../../baz/sample.c9search_results')).toBe('c9search_results');
  });

  it('extractExtension to extract extension from Windows paths', () => {
    expect(io.extractExtension('C:\\Foo\\Bar\\Baz\\file.js')).toBe('js');
    expect(io.extractExtension('2018\\January.xlsx')).toBe('xlsx');
  });
});

describe('io.readFileAsync', () => {
  beforeAll(() => {
    mock({
      'foo/bar': {
        'some-file.txt': 'file contents',
        'empty-dir': {/** empty directory */ }
      },
      'baz/qux': {
        'some.png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
        'vex/bol/wiz': {/** another empty directory */ }
      }
    });
  });

  afterAll(mock.restore);

  it('readFileAsync resolves to string for text file content', async () => {
    await expect(io.readFileAsync('foo/bar/some-file.txt', { encoding: 'utf-8' })).resolves.toBe('file contents');
  });

  it('readFileAsync resolves to Buffer for bytestring file content', async () => {
    await expect(io.readFileAsync('baz/qux/some.png')).resolves.toEqual(Buffer.from([8, 6, 7, 5, 3, 0, 9]));
  });

  it('readFileAsync fails with error on non-existing file', async () => {
    await expect(io.readFileAsync('foo/bar/empty-dir/nonexist.js')).rejects.toThrow(/ENOENT/);
  });
});

describe('io.decompressBinaryObject', () => {
  beforeAll(() => {
    mock({
      'plainfile.txt': 'no compression was used',
      'e2': {
        '7bb34b0807ebf1b91bb66a4c147430cde4f08f': Buffer.from([98, 108, 111, 98, 32, 50, 53, 0, 77, 121, 32, 100, 97, 116, 97, 32, 102,
          105, 116, 115, 32, 111, 110, 32, 111, 110, 101, 32, 108, 105, 110, 101, 10]),
      }
    });
  });

  afterAll(mock.restore);

  it('decompressBinaryObject to decompress binary to UTF-8 string', async () => {
    const compressed = await io.readFileAsync('e2/7bb34b0807ebf1b91bb66a4c147430cde4f08f');
    return expect(io.decompressBinaryObject(compressed, 'utf-8')).toStrictEqual('blob 25\u0000My data fits on one line\n');
  });

  it('decompressBinaryObject to decompress string buffer to UTF-8 string', async () => {
    const compressed = await io.readFileAsync('plainfile.txt');
    return expect(io.decompressBinaryObject(compressed, 'utf-8')).toBe('no compression was used');
  });
});

describe('io.readDirAsync', () => {
  beforeAll(() => {
    mock({
      'foo/bar': {
        'some-file.txt': 'file contents',
        'empty-dir': {/** empty directory */ }
      },
      'baz/qux': {
        'nup/tul/some.png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
        'vex/bol/wiz': {/** another empty directory */ }
      }
    });
  });

  afterAll(mock.restore);

  it('readDirAsync to resolve to array of child filepaths', async () => {
    await expect(io.readDirAsync('foo/bar')).resolves.toHaveLength(2);
  });

  it('readDirAsync fails with an error on non-existent path', async () => {
    await expect(io.readDirAsync('foo/dep/')).rejects.toThrow(/ENOENT/);
  });
});

describe('io.isDirectory', () => {
  beforeAll(() => {
    mock({
      foo: {
        bar: mock.file({ content: 'file contents', ctime: new Date(1) }),
        zap: {
          zip: mock.file({ content: 'file contents', ctime: new Date(1) }),
        },
        'tracked-file.js': 'directory is tracked by git',
      },
      empty: {},
    });
  });

  afterAll(mock.restore);

  it('isDirectory resolves to true for empty directories', () => {
    return expect(io.isDirectory('empty')).resolves.toBe(true);
  });

  it('isDirectory resolves to true for non-empty directories', () => {
    return expect(io.isDirectory('foo/zap')).resolves.toBe(true);
  });

  it('isDirectory resolves to false for file', async () => {
    await expect(io.isDirectory('foo/bar')).resolves.toBe(false);
    await expect(io.isDirectory('foo/tracked-file.js')).resolves.toBe(false);
  });

  it('isDirectory fails with an error on non-existent path', () => {
    return expect(io.isDirectory('foo/dep/')).rejects.toThrow(/ENOENT/);
  });
});

describe('io.readDirAsyncDepth', () => {
  beforeEach(() => {
    mock({
      foo: {
        bar: mock.file({ content: 'file contents', ctime: new Date(1) }),
        baz: mock.file({ content: 'file contents', ctime: new Date(1) }),
        zap: {
          zed: {
            beq: mock.file({ content: 'file contents', ctime: new Date(1) }),
            bup: mock.file({ content: 'file contents', ctime: new Date(1) })
          },
          zip: mock.file({ content: 'file contents', ctime: new Date(1) }),
        }
      },
      zonk: {
        zork: mock.file({ content: 'file contents', ctime: new Date(1) }),
      },
      imp: {
        bamp: {},
      },
      empty: {},
    });
  });

  afterAll(mock.restore);

  it('readDirAsyncDepth resolves an empty directory', async () => {
    const files = await io.readDirAsyncDepth('empty');
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(files).toHaveLength(1);
    expect(files).toMatchSnapshot();
  });

  it('readDirAsyncDepth resolves a directory with sub-files', async () => {
    const files = await io.readDirAsyncDepth('zonk');
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(files).toHaveLength(2);
    expect(files).toMatchSnapshot();
  });

  it('readDirAsyncDepth resolves a directory with sub-directories', async () => {
    const files = await io.readDirAsyncDepth('imp');
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(files).toHaveLength(2);
    expect(files).toMatchSnapshot();
  });

  it('readDirAsyncDepth resolves a directory with multiple layers of directories and files', async () => {
    const files = await io.readDirAsyncDepth('foo');
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(files).toHaveLength(8);
    expect(files).toMatchSnapshot();
  });

  it('readDirAsyncDepth resolves a directory with multiple layers of directories and files to specified depth', async () => {
    const files = await io.readDirAsyncDepth('foo', 2);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(files).toHaveLength(6);
    expect(files).toMatchSnapshot();
  });

  it('readDirAsyncDepth fails with an error on non-existent paths', () => {
    return expect(io.readDirAsyncDepth('foo/dep/')).rejects.toThrow(/ENOENT/);
  });
});

describe('io.filterReadArray', () => {
  beforeAll(() => {
    mock({
      foo: {
        bar: mock.file({ content: 'file contents', ctime: new Date(1) }),
        baz: mock.file({ content: 'file contents', ctime: new Date(1) }),
        zap: {
          zed: {
            beq: mock.file({ content: 'file contents', ctime: new Date(1) }),
            bup: mock.file({ content: 'file contents', ctime: new Date(1) })
          },
          zip: mock.file({ content: 'file contents', ctime: new Date(1) }),
        }
      }
    });
  });

  afterAll(mock.restore);

  it('filterReadArray returns only child directories', () => {
    const paths: fs.PathLike[] = ['foo/bar', 'foo/baz', 'foo/zap/zed/beq', 'foo/zap/zed/bup', 'foo/zap/zed',
      'foo/zap/zip', 'foo/zap', 'foo'];
    return expect(io.filterReadArray(paths)).resolves.toHaveLength(3);
  });

  it('filterReadArray returns only child files', () => {
    const paths: fs.PathLike[] = ['foo/bar', 'foo/baz', 'foo/zap/zed/beq', 'foo/zap/zed/bup', 'foo/zap/zed',
      'foo/zap/zip', 'foo/zap', 'foo'];
    return expect(io.filterReadArray(paths, true)).resolves.toHaveLength(5);
  });
});

describe('io.writeFileAsync', () => {
  beforeAll(() => {
    mock({
      'foo/bar': {
        'fileD.txt': 'version 1'
      },
      'baz': {/** empty directory */ }
    });
  });

  afterAll(mock.restore);

  it('writeFileAsync to resolve and write a new file with string content', async () => {
    const testPath = 'foo/bar/fileA.txt';
    await io.writeFileAsync(testPath, 'sample data');
    await expect(fs.ensureFile(testPath)).resolves.not.toThrow();
    await expect(io.readFileAsync(testPath, { encoding: 'utf-8' })).resolves.toBe('sample data');
  });

  it('writeFileAsync to resolve and write a new file with binary content', async () => {
    const testPath = 'foo/bar/fileB.txt';
    await io.writeFileAsync(testPath, Buffer.from([1, 2, 3]));
    await expect(fs.ensureFile(testPath)).resolves.not.toThrow();
    await expect(io.readFileAsync(testPath)).resolves.toStrictEqual(Buffer.from([1, 2, 3]));
  });

  it('writeFileAsync to resolve and write a new file with base16 content', async () => {
    const testPath = 'foo/bar/fileC.txt';
    await io.writeFileAsync(testPath, Buffer.from([1, 2, 3]), { encoding: 'hex' });
    await expect(fs.ensureFile(testPath)).resolves.not.toThrow();
    await expect(io.readFileAsync(testPath, { encoding: 'hex' })).resolves.toBe('010203');
  });

  it('writeFileAsync to resolve and overwrite an existing file with content', async () => {
    const testPath = 'foo/bar/fileD.txt';
    await expect(io.readFileAsync(testPath, { encoding: 'utf-8' })).resolves.toBe('version 1');
    await io.writeFileAsync(testPath, 'version 2');
    await expect(io.readFileAsync(testPath, { encoding: 'utf-8' })).resolves.toBe('version 2');
  });
});

describe('io.validateFileName', () => {
  const exts = ['ts', 'html'];
  const configExts = ['.gitignore', '.htaccess'];

  it('validateFileName returns false for an invalid file name and true for a valid file name', () => {
    expect(io.validateFileName('<.ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName('>.ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName(':.ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName('".ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName('/.ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName('\\.ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName('|.ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName('?.ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName('*.ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName(' .ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName('..ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName('foo .ts', configExts, exts)).toEqual(false);
    expect(io.validateFileName('bar..ts', configExts, exts)).toEqual(false);

    expect(io.validateFileName('foo.ts', configExts, exts)).toEqual(true);
    expect(io.validateFileName('bar.html', configExts, exts)).toEqual(true);
  });
});

describe('io.replaceExt', () => {
  const newFiletype: Filetype = {
    id: '55',
    filetype: 'JavaScript',
    handler: 'Editor',
    extensions: ['js', 'jsm']
  }

  const configFiletype: Filetype = {
    id: '17',
    filetype: 'ApacheConf',
    handler: 'Editor',
    extensions: ['.htaccess']
  }

  it('replaceFileType appends a normal extension to file name with no pre-existing extension', () => {
    expect(io.replaceExt('foo', newFiletype)).toBe('foo.js');
  });

  it('replaceFileType appends a normal extension to file name with a pre-existing extension', () => {
    expect(io.replaceExt('foo.html', newFiletype)).toBe('foo.js');
  });

  it('replaceFileType appends a normal extension to file name with a trailing "."', () => {
    expect(io.replaceExt('foo.', newFiletype)).toBe('foo.js');
  });

  it('replaceFileType appends a .config extension to file name with no pre-existing extension', () => {
    expect(io.replaceExt('foo', configFiletype)).toBe('foo.htaccess');
  });

  it('replaceFileType appends a .config extension to file name with a pre-existing extension', () => {
    expect(io.replaceExt('foo.html', configFiletype)).toBe('foo.htaccess');
  });

  it('replaceFileType appends a .config extension to file name with a trailing "."', () => {
    expect(io.replaceExt('foo.', configFiletype)).toBe('foo.htaccess');
  });
});