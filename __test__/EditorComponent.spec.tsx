import React from 'react';
import { mount } from 'enzyme';
import * as ace from 'ace-builds'; // ace module
ace.config.set('basePath', '');
ace.config.set('modePath', '');
ace.config.set('themePath', '');
import AceEditor, { IMarker } from 'react-ace';
import { AceEditorClass } from 'react-ace/lib/AceEditorClass';
import ReactAce from 'react-ace/lib/ace';

import { wrapInTestContext } from './__mocks__/dndReduxMock';
import { getMockStore } from './__mocks__/reduxStoreMock';
import Editor from '../src/components/Editor';

describe('Editor', () => {

  // Required for the document.getElementById used by Ace can work in the test environment
  const domElement = document.getElementById('app');
  const mountOptions = {
    attachTo: domElement,
  };
  const store = getMockStore();

  it('Editor component should work', () => {
    const EditorContext = wrapInTestContext(Editor, store);
    const wrapper = mount(<EditorContext metafileId='199' />, mountOptions);
    const component = wrapper.find(Editor).first();
    expect(component).toBeDefined();
  });

  it('Editor component should render AceEditor markers', () => {
    const EditorContext = wrapInTestContext(Editor, store);
    const wrapper = mount(<EditorContext metafileId='199' />, mountOptions);
    const editor: AceEditorClass = (wrapper.find(AceEditor).first().instance() as ReactAce).editor;
    const marker: IMarker = {
      startRow: 3, startCol: 0, endRow: 3, endCol: 10, type: 'text', className: 'test-marker'
    };
    editor.getSession().addMarker(marker);

    expect(editor.getSession().getMarkers()['3'].range.className).toBe('test-marker');
    expect(editor.getSession().getMarkers()['3'].range.type).toBe('text');
    expect(editor.getSession().getMarkers()).toMatchSnapshot();
  });
});