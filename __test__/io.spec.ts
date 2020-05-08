import mock from 'mock-fs';
import * as io from '../src/containers/io';
import * as fs from 'fs-extra';

describe('io.deserialize', () => {
  it('deserialize to parse a JSON string into a TypeScript object', () => {
    const json = '{"result":true, "count":42}';
    type typedJson = { result: boolean; count: number };
    const deserializedJson = io.deserialize<typedJson>(json);
    expect(typeof deserializedJson.result).toBe('boolean');
    expect(deserializedJson.result).toBe(true);
    expect(deserializedJson).toMatchSnapshot();
  });

  it('deserialize fails with an error on malformed JSON', () => {
    // eslint-disable-next-line no-useless-escape
    const malformedJson = '{ "key": "Something \\\\"Name\\\\" something\", "anotherkey": "value" }';
    expect(() => io.deserialize(malformedJson)).toThrow(SyntaxError);
  });
});

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
    await expect(io.readFileAsync('foo/bar/some-file.txt', { encoding: 'utf8' })).resolves.toBe('file contents');
  });

  it('readFileAsync resolves to Buffer for bytestring file content', async () => {
    await expect(io.readFileAsync('baz/qux/some.png')).resolves.toEqual(Buffer.from([8, 6, 7, 5, 3, 0, 9]));
  });

  it('readFileAsync fails with error on non-existing file', async () => {
    await expect(io.readFileAsync('foo/bar/empty-dir/nonexist.js')).rejects.toThrow(/ENOENT/);
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

  it('readDirAsync fails with an error', async () => {
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
        }
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

  it('isDirectory resolves to false for file', () => {
    return expect(io.isDirectory('foo/bar')).resolves.toBe(false);
  });
});

describe('io.readDirAsyncDeep', () => {
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

  it('readDirAsyncDeep resolves an empty directory', () => {
    return expect(io.readDirAsyncDeep('empty')).resolves.toHaveLength(1);
  });

  it('readDirAsyncDeep resolves a directory with sub-files', () => {
    return expect(io.readDirAsyncDeep('zonk')).resolves.toHaveLength(2);
  });

  it('readDirAsyncDeep resolves a directory with sub-directories', () => {
    return expect(io.readDirAsyncDeep('imp')).resolves.toHaveLength(2);
  });

  it('readDirAsyncDeep inclusively resolves a directory with multiple layers of directories and files', () => {
    return expect(io.readDirAsyncDeep('foo', true)).resolves.toHaveLength(8);
  });

  it('readDirAsyncDeep exclusively resolves a directory with multiple layers of directories and files', () => {
    return expect(io.readDirAsyncDeep('foo', false)).resolves.toHaveLength(7);
  });

  it('readDirAsyncDeep fails with an error on non-existent paths', () => {
    return expect(io.readDirAsyncDeep('foo/dep/')).rejects.toThrow(/ENOENT/);
  });
});

describe('io.writeFileAsync', () => {
  beforeAll(() => {
    mock({
      'foo/bar': {
        'fileB.txt': 'version 1'
      },
      'baz': {/** empty directory */ }
    });
  });

  afterAll(mock.restore);

  it('writeFileAsync to resolve and write a new file with content', async () => {
    const testPath = 'foo/bar/fileA.txt';
    await io.writeFileAsync(testPath, 'sample data');
    await expect(fs.ensureFile(testPath)).resolves.not.toThrow();
    await expect(io.readFileAsync(testPath, { encoding: 'utf8' })).resolves.toBe('sample data');
  });

  it('writeFileAsync to resolve and overwrite an existing file with content', async () => {
    const testPath = 'foo/bar/fileB.txt';
    await expect(io.readFileAsync(testPath, { encoding: 'utf8' })).resolves.toBe('version 1');
    await io.writeFileAsync(testPath, 'version 2');
    await expect(io.readFileAsync(testPath, { encoding: 'utf8' })).resolves.toBe('version 2');
  });
});