import { generateFileTreeActions } from '../src/containers/explorer';
import mock from 'mock-fs';

describe('explorer.generateTreeNodeObject', () => {

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

    it('generateFileTreeActions parses a directory populated with directories and files', () => {
        return expect(generateFileTreeActions('foo')).resolves.toHaveLength(8);
    });

    it('generateFileTreeActions parses a directory with one file', () => {
        return expect(generateFileTreeActions('zonk')).resolves.toHaveLength(2);
    });

    it('generateFileTreeActions parses a directory with one directory', () => {
        return expect(generateFileTreeActions('imp')).resolves.toHaveLength(2);
    });

    it('generateFileTreeActions parses an empty directory', () => {
        return expect(generateFileTreeActions('empty')).resolves.toHaveLength(1);
    });

});