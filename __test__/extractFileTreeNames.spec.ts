import mock from 'mock-fs';
import { extractFileTreeNames } from '../src/containers/filetree';

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

  it('extractFileTreeNames locates direct descendant subfiles and subdirectories', async () => {
    return expect(extractFileTreeNames('foo/zap/zed/')).resolves.toHaveLength(3);
  });

  it('extractFileTreeNames locates all subfiles and subdirectories in a file tree', async () => {
    return expect(extractFileTreeNames('foo/')).resolves.toHaveLength(8);
  });
});