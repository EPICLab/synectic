import { generateFileTreeObject } from '../src/containers/explorer';
import mock from 'mock-fs';

describe('explorer.generateTreeNodeObject', () => {

    beforeAll(() => {
        mock({
            'foo': {},
            'bar': {
                zap: mock.file({
                    content: 'file contents'
                })
            },
            'baz': {
                'zoink': {}
            }
        });
    });

    afterAll(mock.restore);

    it('generateTreeNodeObject parses an empty directory', () => {
        expect(generateFileTreeObject('foo')).resolves.toStrictEqual([]);
    });

    it('generateTreeNodeObject parses a directory with one file', () => {
        expect(generateFileTreeObject('bar')).resolves.toBe([{ "filePath": "bar/zap", "files": [], "isFile": true }]);
    });

    it('generateTreeNodeObject parses a directory with one directory', () => {
        expect(generateFileTreeObject('baz')).resolves.toBe([{ "filePath": "baz/zoink", "files": [], "isFile": false }]);
    });
});