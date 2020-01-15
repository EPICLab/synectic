import React from 'react';
import mock from 'mock-fs';
import { FileTreeComponent } from '../src/components/FileExplorer';
import { mount } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndMock';

describe('FileExplorer', () => {

    beforeEach(() => {
        mock({
            foo: {
                bar: 'content sample'
            }
        });
    });

    afterEach(mock.restore);

    it('FileExplorer has one folder', () => {
        const FileTreeContext = wrapInTestContext(FileTreeComponent);
        const enzymeWrapper = mount(<FileTreeContext path='foo' />);
        return expect(enzymeWrapper.find('ul')).toHaveLength(1);
    });
});