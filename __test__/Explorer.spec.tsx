import React from 'react';
import mock from 'mock-fs';
import { mount } from 'enzyme';

import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { getMockStore } from './__mocks__/reduxStoreMock.old';
import Explorer from '../src/components/Explorer';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';

describe('FileExplorerComponent', () => {

  beforeAll(() => {
    mock({
      withchildren: {
        testdir: {},
        test: mock.file({ content: 'file contents', ctime: new Date(1), mtime: new Date(1) })
      }
    });
  });
  afterAll(mock.restore);

  const domElement = document.getElementById('app');
  const mountOptions = {
    attachTo: domElement,
  };
  const store = getMockStore();

  it('Explorer defaults to rendering only the root directory', () => {
    const ExplorerContext = wrapInReduxContext(Explorer, store);
    const wrapper = mount(<ExplorerContext rootId={'99'} />, mountOptions);
    expect(wrapper.find(Explorer)).toHaveLength(1);
    expect(wrapper.find(Explorer).prop('rootId')).toBe('99');
    expect(wrapper.find(TreeView)).toHaveLength(1);
    expect(wrapper.find(TreeItem)).toHaveLength(0);
    // expect(wrapper.find(TreeItem).first().props().children).toStrictEqual([[], []]);
  });

  // it('FileExplorer renders without child components when no child files/directories exist', () => {
  //   const FileExplorerContext = wrapInReduxContext(FileExplorerComponent, store);
  //   const wrapper = mount(<FileExplorerContext rootId={'99'} />, mountOptions);
  //   expect(wrapper.find(TreeItem)).toHaveLength(1);
  //     expect(wrapper.find(TreeItem).first().props().nodeId).toBe('99');
  //     expect(wrapper.find(TreeItem).first().props().children).toStrictEqual([[], []]);
  // });

  it('Explorer renders child components for each child file/directory', () => {
    const ExplorerContext = wrapInReduxContext(Explorer, store);
    const wrapper = mount(<ExplorerContext rootId={'24'} />, mountOptions);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(wrapper.find(TreeView)).toHaveLength(1);
    expect(wrapper.find(TreeView).first().props().children).toHaveLength(2);
    // expect(wrapper.find(TreeItem)).toHaveLength(1);
    // expect(wrapper.find(TreeItem).first().props().children).toMatchSnapshot();
  });

  // it('FileExplorer renders the correct current branch name for untracked directory', () => {
  //   const FileExplorerContext = wrapInReduxContext(FileExplorerComponent, store);
  //   const wrapper = mount(<FileExplorerContext rootId={'99'} />, mountOptions);
  //   expect(wrapper.find(FileExplorerComponent).first().html()).toContain('Branch: undefined');
  // });

  // it('FileExplorer renders the correct current branch name for tracked directory', () => {
  //   const FileExplorerContext = wrapInReduxContext(FileExplorerComponent, store);
  //   const wrapper = mount(<FileExplorerContext rootId={'75'} />, mountOptions);
  //   expect(wrapper.find(FileExplorerComponent).first().html()).toContain('Branch: master');
  // });

});