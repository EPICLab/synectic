import * as fs from 'fs-extra';
import { Filetype } from '../store/slices/filetypes';
import { file, mock, MockInstance } from '../test-utils/mock-fs';
import * as io from './io';

describe('io.extractStats', () => {
    let mockedInstance: MockInstance;
    beforeAll(async () => {
        const instance = await mock({
            foo: {
                bar: file({
                    content: 'file-content',
                    mtime: new Date(1)
                })
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('extractStats to extract relevant file information from valid path', async () => {
        expect.assertions(1);
        await expect(io.extractStats('foo/bar')).resolves.toHaveProperty('mtime', new Date(1));
    });

    it('extractStats to return undefined from nonexistent path', async () => {
        expect.assertions(1);
        await expect(io.extractStats('foo/baz')).resolves.toBeUndefined();
    });
});

describe('io.extractFilename', () => {
    it('extractFilename to extract filename from Linux/MacOS paths', () => {
        expect.assertions(3);
        expect(io.extractFilename('/Users/foo/bar/module.d.ts')).toBe('module.d.ts');
        expect(io.extractFilename('./baz/webpack.config.js')).toBe('webpack.config.js');
        expect(io.extractFilename('../../baz/sample.c9search_results')).toBe('sample.c9search_results');
    });

    it('extractFilename to extract filename from Windows paths', () => {
        expect.assertions(2);
        expect(io.extractFilename('C:\\Foo\\Bar\\Baz\\file.js')).toBe('file.js');
        expect(io.extractFilename('2018\\January.xlsx')).toBe('January.xlsx');
    });
});

describe('io.extractDirname', () => {
    it('extractDirname to extract dirname from Linux/MacOS paths', () => {
        expect.assertions(7);
        expect(io.extractDirname('/Users/foo/bar/module.d.ts')).toBe('bar');
        expect(io.extractDirname('./baz/webpack.config.js')).toBe('baz');
        expect(io.extractDirname('../../baz/sample.c9search_results')).toBe('baz');
        expect(io.extractDirname('/Users/foo/bar/')).toBe('bar');
        expect(io.extractDirname('bar/')).toBe('bar');
        expect(io.extractDirname('/setup.cfg')).toBe('');
        expect(io.extractDirname('module.d.ts')).toBe('');
    });

    it('extractDirname to extract dirname from Windows paths', () => {
        expect.assertions(3);
        expect(io.extractDirname('C:\\Foo\\Bar\\Baz\\file.js')).toBe('Baz');
        expect(io.extractDirname('2018\\January.xlsx')).toBe('2018');
        expect(io.extractDirname('C:\\Foo\\Bar\\Baz\\')).toBe('Baz');
    });

    it('extractDirname resolves malformed paths', () => {
        expect.assertions(4);
        expect(io.extractDirname('')).toBe('');
        expect(io.extractDirname('/')).toBe('');
        expect(io.extractDirname(' /')).toBe(' ');
        expect(io.extractDirname('/ ')).toBe('');
    });
});

describe('io.extractExtension', () => {
    it('extractExtension to extract extension from filename', () => {
        expect.assertions(3);
        expect(io.extractExtension('foo.js')).toBe('js');
        expect(io.extractExtension('bar.d.ts')).toBe('ts');
        expect(io.extractExtension('.htaccess')).toBe('htaccess');
    });

    it('extractExtension to extract extension from Linux/MacOS paths', () => {
        expect.assertions(3);
        expect(io.extractExtension('/Users/foo/bar/module.d.ts')).toBe('ts');
        expect(io.extractExtension('./baz/webpack.config.js')).toBe('js');
        expect(io.extractExtension('../../baz/sample.c9search_results')).toBe('c9search_results');
    });

    it('extractExtension to extract extension from Windows paths', () => {
        expect.assertions(2);
        expect(io.extractExtension('C:\\Foo\\Bar\\Baz\\file.js')).toBe('js');
        expect(io.extractExtension('2018\\January.xlsx')).toBe('xlsx');
    });
});

describe('io.isEqualPaths', () => {
    it('isEqualPaths resolves to true for absolutely equivalent paths', () => {
        expect.assertions(1);
        expect(io.isEqualPaths('foo/bar/example.ts', 'foo/bar/example.ts')).toBeTruthy();
    });

    it('isEqualPaths resolves to true for relatively equivalent paths', () => {
        expect.assertions(1);
        expect(io.isEqualPaths('foo/bar/example.ts', 'qux/../foo/bar/example.ts')).toBeTruthy();
    });

    it('isEqualPaths resolves to false for non-equivalent paths', () => {
        expect.assertions(3);
        expect(io.isEqualPaths('foo/bar/example.ts', 'foo/bar/sample.js')).toBeFalsy();
        expect(io.isEqualPaths('foo/bar/example.ts', 'qux/bar/example.ts')).toBeFalsy();
        expect(io.isEqualPaths('foo/bar/example.ts', 'foo/bar')).toBeFalsy();
    });
});

describe('io.isDescendant', () => {
    it('isDescendant resolves to true for child paths', () => {
        expect.assertions(2);
        expect(io.isDescendant('foo/', 'foo/bar/example.ts')).toBeTruthy();
        expect(io.isDescendant('foo/bar/', 'qux/../foo/bar/example.ts')).toBeTruthy();
    });

    it('isDescendant resolves to true on direct child paths only with `direct` enabled', () => {
        expect.assertions(2);
        expect(io.isDescendant('foo/bar/', 'foo/bar/example.ts', true)).toBeTruthy();
        expect(io.isDescendant('foo/', 'foo/bar/example.ts', true)).toBeFalsy();
    });

    it('isDescendant resolves to false for equivalent paths', () => {
        expect.assertions(2);
        expect(io.isDescendant('foo/bar/example.ts', 'foo/bar/example.ts')).toBeFalsy();
        expect(io.isDescendant('foo/bar/example.ts', 'qux/../foo/bar/example.ts')).toBeFalsy();
    });
});

describe('io.readFileAsync', () => {
    let mockedInstance: MockInstance;
    beforeAll(async () => {
        const instance = await mock({
            'foo.txt': 'extra',
            'foo/bar/': {
                'some-file.txt': 'file contents',
                'empty-dir': { /* empty directory */ }
            },
            'baz/qux/': {
                'some.png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
                'vex/bol/wiz': { /* another empty directory */ }
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('readFileAsync resolves to string for text file content', async () => {
        expect.assertions(1);
        await expect(io.readFileAsync('foo/bar/some-file.txt', { encoding: 'utf-8' })).resolves.toBe('file contents');
    });

    it('readFileAsync resolves to Buffer for bytestring file content', async () => {
        expect.assertions(1);
        await expect(io.readFileAsync('baz/qux/some.png')).resolves.toEqual(Buffer.from([8, 6, 7, 5, 3, 0, 9]));
    });

    it('readFileAsync fails with error on non-existing file', async () => {
        expect.assertions(1);
        await expect(io.readFileAsync('foo/bar/empty-dir/nonexist.js')).rejects.toThrow(/ENOENT/);
    });

    it('readFileAsync fails with error on directory paths', async () => {
        expect.assertions(1);
        await expect(io.readFileAsync('foo/bar')).rejects.toThrow(/EISDIR/);
    });
});

describe('io.decompressBinaryObject', () => {
    let mockedInstance: MockInstance;
    beforeAll(async () => {
        const instance = await mock({
            'plainfile.txt': 'no compression was used',
            'e2': {
                '7bb34b0807ebf1b91bb66a4c147430cde4f08f': Buffer.from([98, 108, 111, 98, 32, 50, 53, 0, 77, 121, 32, 100, 97, 116,
                    97, 32, 102, 105, 116, 115, 32, 111, 110, 32, 111, 110, 101, 32, 108, 105, 110, 101, 10]),
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('decompressBinaryObject to decompress binary to UTF-8 string', async () => {
        expect.assertions(1);
        const compressed = await io.readFileAsync('e2/7bb34b0807ebf1b91bb66a4c147430cde4f08f');
        return expect(io.decompressBinaryObject(compressed, 'utf-8')).toStrictEqual('blob 25\u0000My data fits on one line\n');
    });

    it('decompressBinaryObject to decompress string buffer to UTF-8 string', async () => {
        expect.assertions(1);
        const compressed = await io.readFileAsync('plainfile.txt');
        return expect(io.decompressBinaryObject(compressed, 'utf-8')).toBe('no compression was used');
    });
});

describe('io.readDirAsync', () => {
    let mockedInstance: MockInstance;
    beforeAll(async () => {
        const instance = await mock({
            'foo/bar': {
                'some-file.txt': 'file contents',
                'empty-dir': { /* empty directory */ }
            },
            'baz/qux': {
                'nup/tul/some.png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
                'vex/bol/wiz': { /* another empty directory */ }
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('readDirAsync to resolve to array of child filepaths', async () => {
        expect.assertions(1);
        await expect(io.readDirAsync('foo/bar')).resolves.toHaveLength(2);
    });

    it('readDirAsync fails with an error on non-existent path', async () => {
        expect.assertions(1);
        await expect(io.readDirAsync('foo/dep/')).rejects.toThrow(/ENOENT/);
    });

    it('readDirAsync fails with an error on file paths', async () => {
        expect.assertions(1);
        await expect(io.readDirAsync('foo/bar/some-file.txt')).rejects.toThrow(/ENOTDIR/);
    });
});

describe('io.isDirectory', () => {
    let mockedInstance: MockInstance;
    beforeAll(async () => {
        const instance = await mock({
            foo: {
                bar: file({ content: 'file contents', mtime: new Date(1) }),
                zap: {
                    zip: file({ content: 'file contents', mtime: new Date(1) }),
                },
                'tracked-file.js': 'directory is tracked by git',
            },
            empty: {},
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('isDirectory resolves to true for empty directories', () => {
        expect.assertions(1);
        return expect(io.isDirectory('empty')).resolves.toBe(true);
    });

    it('isDirectory resolves to true for non-empty directories', () => {
        expect.assertions(1);
        return expect(io.isDirectory('foo/zap')).resolves.toBe(true);
    });

    it('isDirectory resolves to false for file', async () => {
        expect.assertions(2);
        await expect(io.isDirectory('foo/bar')).resolves.toBe(false);
        await expect(io.isDirectory('foo/tracked-file.js')).resolves.toBe(false);
    });

    it('isDirectory fails with an error on non-existent path', () => {
        expect.assertions(1);
        return expect(io.isDirectory('foo/dep/')).rejects.toThrow(/ENOENT/);
    });
});

describe('io.readDirAsyncDepth', () => {
    let mockedInstance: MockInstance;
    beforeAll(async () => {
        const instance = await mock({
            foo: {
                bar: file({ content: 'file contents', mtime: new Date(1) }),
                baz: file({ content: 'file contents', mtime: new Date(1) }),
                zap: {
                    zed: {
                        beq: file({ content: 'file contents', mtime: new Date(1) }),
                        bup: file({ content: 'file contents', mtime: new Date(1) })
                    },
                    zip: file({ content: 'file contents', mtime: new Date(1) }),
                }
            },
            zonk: {
                zork: file({ content: 'file contents', mtime: new Date(1) }),
            },
            imp: {
                bamp: {},
            },
            empty: {},
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('readDirAsyncDepth resolves an empty directory', async () => {
        expect.assertions(2);
        const files = await io.readDirAsyncDepth('empty');
        expect(files).toHaveLength(1);
        expect(files).toMatchSnapshot();
    });

    it('readDirAsyncDepth resolves a directory with sub-files', async () => {
        expect.assertions(2);
        const files = await io.readDirAsyncDepth('zonk');
        expect(files).toHaveLength(2);
        expect(files).toMatchSnapshot();
    });

    it('readDirAsyncDepth resolves a directory with sub-directories', async () => {
        expect.assertions(2);
        const files = await io.readDirAsyncDepth('imp');
        expect(files).toHaveLength(2);
        expect(files).toMatchSnapshot();
    });

    it('readDirAsyncDepth resolves a directory with multiple layers of directories and files', async () => {
        expect.assertions(2);
        const files = await io.readDirAsyncDepth('foo');
        expect(files).toHaveLength(8);
        expect(files).toMatchSnapshot();
    });

    it('readDirAsyncDepth resolves a directory with multiple layers of directories and files to specified depth', async () => {
        expect.assertions(2);
        const files = await io.readDirAsyncDepth('foo', 2);
        expect(files).toHaveLength(6);
        expect(files).toMatchSnapshot();
    });

    it('readDirAsyncDepth fails with an error on non-existent paths', () => {
        expect.assertions(1);
        return expect(io.readDirAsyncDepth('foo/dep/')).rejects.toThrow(/ENOENT/);
    });

    it('readDirAsyncDepth fails with an error on file paths', () => {
        expect.assertions(1);
        return expect(io.readDirAsyncDepth('foo/bar')).rejects.toThrow(/ENOTDIR/);
    });
});

describe('io.filterReadArray', () => {
    let mockedInstance: MockInstance;
    beforeAll(async () => {
        const instance = await mock({
            foo: {
                bar: file({ content: 'file contents', mtime: new Date(1) }),
                baz: file({ content: 'file contents', mtime: new Date(1) }),
                zap: {
                    zed: {
                        beq: file({ content: 'file contents', mtime: new Date(1) }),
                        bup: file({ content: 'file contents', mtime: new Date(1) })
                    },
                    zip: file({ content: 'file contents', mtime: new Date(1) }),
                }
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('filterReadArray returns only child directories', () => {
        expect.assertions(1);
        const paths: fs.PathLike[] = ['foo/bar', 'foo/baz', 'foo/zap/zed/beq', 'foo/zap/zed/bup', 'foo/zap/zed',
            'foo/zap/zip', 'foo/zap', 'foo'];
        return expect(io.filterReadArray(paths)).resolves.toHaveLength(3);
    });

    it('filterReadArray returns only child files', () => {
        expect.assertions(1);
        const paths: fs.PathLike[] = ['foo/bar', 'foo/baz', 'foo/zap/zed/beq', 'foo/zap/zed/bup', 'foo/zap/zed',
            'foo/zap/zip', 'foo/zap', 'foo'];
        return expect(io.filterReadArray(paths, true)).resolves.toHaveLength(5);
    });
});

describe('io.writeFileAsync', () => {
    let mockedInstance: MockInstance;
    beforeAll(async () => {
        const instance = await mock({
            'foo/bar': {
                'fileD.txt': 'version 1'
            },
            'baz': { /** empty directory */ }
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('writeFileAsync to resolve and write a new file with string content', async () => {
        expect.assertions(2);
        const testPath = 'foo/bar/fileA.txt';
        await io.writeFileAsync(testPath, 'sample data');
        await expect(fs.ensureFile(testPath)).resolves.not.toThrow();
        await expect(io.readFileAsync(testPath, { encoding: 'utf-8' })).resolves.toBe('sample data');
    });

    it('writeFileAsync to resolve and write a new file with binary content', async () => {
        expect.assertions(2);
        const testPath = 'foo/bar/fileB.txt';
        await io.writeFileAsync(testPath, Buffer.from([1, 2, 3]));
        await expect(fs.ensureFile(testPath)).resolves.not.toThrow();
        await expect(io.readFileAsync(testPath)).resolves.toStrictEqual(Buffer.from([1, 2, 3]));
    });

    it('writeFileAsync to resolve and write a new file with base16 content', async () => {
        expect.assertions(2);
        const testPath = 'foo/bar/fileC.txt';
        await io.writeFileAsync(testPath, Buffer.from([1, 2, 3]), { encoding: 'hex' });
        await expect(fs.ensureFile(testPath)).resolves.not.toThrow();
        await expect(io.readFileAsync(testPath, { encoding: 'hex' })).resolves.toBe('010203');
    });

    it('writeFileAsync to resolve and overwrite an existing file with content', async () => {
        expect.assertions(2);
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
        expect.assertions(15);
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
    it('replaceFileType appends a normal extension to file name with no existing extension', () => {
        expect.assertions(1);
        expect(io.replaceExt('foo', newFiletype)).toBe('foo.js');
    });
    it('replaceFileType appends a normal extension to file name with an existing extension', () => {
        expect.assertions(1);
        expect(io.replaceExt('foo.html', newFiletype)).toBe('foo.js');
    });
    it('replaceFileType appends a normal extension to file name with a trailing "."', () => {
        expect.assertions(1);
        expect(io.replaceExt('foo.', newFiletype)).toBe('foo.js');
    });
    it('replaceFileType appends a .config extension to file name with no existing extension', () => {
        expect.assertions(1);
        expect(io.replaceExt('foo', configFiletype)).toBe('foo.htaccess');
    });
    it('replaceFileType appends a .config extension to file name with an existing extension', () => {
        expect.assertions(1);
        expect(io.replaceExt('foo.html', configFiletype)).toBe('foo.htaccess');
    });
    it('replaceFileType appends a .config extension to file name with a trailing "."', () => {
        expect.assertions(1);
        expect(io.replaceExt('foo.', configFiletype)).toBe('foo.htaccess');
    });
});