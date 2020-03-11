import React from 'react';
import { mount } from 'enzyme';
import { getMockStore } from './__mocks__/baseReduxMock';
import FileExplorerComponent from '../src/components/FileExplorer';
import { wrapInTestContext } from './__mocks__/dndReduxMock';
import TreeView from '@material-ui/lab/TreeView';
import mock from 'mock-fs';

describe('FileExplorerComponent', () => {
    beforeAll(() => {
        mock({
            withchildren: {
                testdir: {},
                test: mock.file({ content: 'file contents', ctime: new Date(1) })
            }
        });
    });
    afterAll(mock.restore);

    const domElement = document.getElementById('app');
    const mountOptions = {
        attachTo: domElement,
    };
    const store = getMockStore();

    it('FileExplorer should render exactly one file explorer component', () => {
        const FileExplorerContext = wrapInTestContext(FileExplorerComponent, store);
        const wrapper = mount(<FileExplorerContext metaDirId={'99'} />, mountOptions);
        const component = wrapper.find(FileExplorerComponent).first();
        expect(component).toBeDefined();
        expect(component).toHaveLength(1);
    });

    it('FileExplorer should render exactly one tree view component', () => {
        const FileExplorerContext = wrapInTestContext(FileExplorerComponent, store);
        const wrapper = mount(<FileExplorerContext metaDirId={'99'} />, mountOptions);
        const component = wrapper.find(TreeView).first();
        expect(component).toBeDefined();
        expect(component).toHaveLength(1);
    });

    it('FileExplorer should correctly render root with no children', () => {
        const FileExplorerContext = wrapInTestContext(FileExplorerComponent, store);
        const wrapper = mount(<FileExplorerContext metaDirId={'99'} />, mountOptions);
        const component = wrapper.find(TreeView).first();
        expect(component.html()).toContain('tree');
        expect(component.html()).toContain('MuiTreeView-root');
        expect(component.html()).toContain('MuiTreeItem-root');
        expect(component.html()).toContain('treeitem');
        expect(component.html()).toContain('testdir');
    });

    it('FileExplorer should correctly render root with children', () => {
        const FileExplorerContext = wrapInTestContext(FileExplorerComponent, store);
        const wrapper = mount(<FileExplorerContext metaDirId={'24'} />, mountOptions);
        const component = wrapper.find(TreeView).first();
        expect(component.html()).toContain('tree');
        expect(component.html()).toContain('MuiTreeView-root');
        expect(component.html()).toContain('MuiTreeItem-root');
        expect(component.html()).toContain('treeitem');
        expect(component.html()).toContain('withchildren');
    });
});