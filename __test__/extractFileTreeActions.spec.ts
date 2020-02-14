import mock from 'mock-fs';
import * as fs from 'fs-extra';
import * as io from '../src/containers/io';

const isFile = async (filepath: fs.PathLike): Promise<string | undefined> => {
  const stat = await io.extractStats(filepath.toString());
  if (stat?.isFile()) return filepath.toString();
  else return undefined;
}

const isDir = async (filepath: fs.PathLike): Promise<string | undefined> => {
  const stat = await io.extractStats(filepath.toString());
  if (stat?.isDirectory()) return filepath.toString();
  else return undefined;
}

const removeUndefined = <T>(array: (T | undefined)[]): T[] => {
  return array.filter((item): item is T => typeof item !== 'undefined');
}

const extractFileTreeActions = async (filepath: fs.PathLike): Promise<string[]> => {
  filepath = filepath.toString().replace(/[/\\]$/g, '');

  // extract a list of filenames for all direct descendant files and directories
  const descendants = await io.extractReaddir(filepath.toString());
  if (!descendants) return [filepath.toString()];

  // using isFile, extract a list of only direct descendant files
  const childFiles = removeUndefined(await Promise.all(descendants.map(child => isFile(`${filepath.toString()}/${child}`))));

  // using isDir, extract a list of only direct descendant directories
  const childDirs = removeUndefined(await Promise.all(descendants.map(child => isDir(`${filepath.toString()}/${child}`))));

  // recursively extract the list of actions for each direct descendant directory
  const subDirs = await Promise.all(childDirs.map(dir => extractFileTreeActions(dir)));

  // since the list of actions for each direct descendant directory results in a 2-dimensional array, zipper the arrays together
  const subActions = subDirs.reduce((accum, item) => { return [...accum, ...item] }, []);

  // return the list of actions compiled from the current directory, all direct descendant files, and the recursive results
  // of calling this function on all direct descendant directories (which were then zippered into a flat 1-dimensional array)
  return [filepath.toString(), ...childFiles, ...subActions];
};

describe('extractFileTreeActions', () => {

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

  it('extractFileTreeActions locates direct descendant subfiles and subdirectories', async () => {
    return expect(extractFileTreeActions('foo/zap/zed/')).resolves.toHaveLength(3);
  });

  it('extractFileTreeActions locates all subfiles and subdirectories in a file tree', async () => {
    return expect(extractFileTreeActions('foo/')).resolves.toHaveLength(8);
  });
});