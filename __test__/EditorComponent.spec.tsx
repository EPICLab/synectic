import React from 'react';
import { mount } from 'enzyme';
import * as ace from 'ace-builds'; // ace module
ace.config.set('basePath', '');
ace.config.set('modePath', '');
ace.config.set('themePath', '');
import AceEditor from 'react-ace';
import ReactAce from 'react-ace/lib/ace';
import { IAceEditor } from 'react-ace/lib/types';

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
    const editor: IAceEditor = (wrapper.find(AceEditor).first().instance() as ReactAce).editor;
    const range: ace.Ace.Range = new ace.Range(3, 0, 3, 10);
    editor.getSession().addMarker(range, 'test-marker', 'text');
    const markers = editor.getSession().getMarkers();

    expect(markers[3].clazz).toBe('test-marker');
    expect(markers[3].type).toBe('text');
    expect(editor.getSession().getMarkers()).toMatchSnapshot();
  });
});