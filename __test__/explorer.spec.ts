import { generateTreeNodeObject } from '../src/containers/explorer';
import mock from 'mock-fs';

describe('explorer.generateTreeNodeObject', () => {

    beforeAll(() => {
        mock({
            'foo': {},
            'bar': { 'zap.js': 'sample content' },
            'zap.js': 'sample content',
            'baz': { 'foo': {} }
        });
    });

    afterAll(mock.restore);

    it('generateTreeNodeObject parses an empty directory', async () => {
        return expect(generateTreeNodeObject('foo/')).resolves.toHaveLength(0);
    });

    it('generateTreeNodeObject parses a directory with one file', async () => {
        const result = await generateTreeNodeObject('bar');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ "filePath": "bar/zap.js", "files": [], "isFileBool": true, });
    });

    it('generateTreeNodeObject parses a file', async () => {
        return expect(generateTreeNodeObject('zap.js')).rejects;
    });

    it('generateTreeNodeObject parses a directory with one directory', async () => {
        const result = await generateTreeNodeObject('baz');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ "filePath": "baz/foo", "files": [], "isFileBool": false, });
    });
});