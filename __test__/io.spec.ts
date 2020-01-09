import mock from 'mock-fs';
import * as fs from 'fs-extra';
import * as io from '../src/containers/io';

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
        'nup/tul/some.png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
        'vex/bol/wiz': {/** another empty directory */ }
      }
    });
  });

  afterAll(mock.restore);

  it('readFileAsync to resolve to file contents', async () => {
    await expect(io.readFileAsync('foo/bar/some-file.txt')).resolves.toBe('file contents');
  });

  it('readFileAsync fails with an error', async () => {
    await expect(io.readFileAsync('foo/bar/empty-dir/nonexist.js')).rejects.toThrow(/ENOENT/);
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
    await expect(io.readFileAsync(testPath)).resolves.toBe('sample data');
  });

  it('writeFileAsync to resolve and overwrite an existing file with content', async () => {
    const testPath = 'foo/bar/fileB.txt';
    await expect(io.readFileAsync(testPath)).resolves.toBe('version 1');
    await io.writeFileAsync(testPath, 'version 2');
    await expect(io.readFileAsync(testPath)).resolves.toBe('version 2');
  });
});