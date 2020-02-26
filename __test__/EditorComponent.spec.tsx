import React from 'react';
import { mount } from 'enzyme';
import 'ace-builds';
import AceEditor from 'react-ace';
import { AceEditorClass } from 'react-ace/lib/AceEditorClass';
import ReactAce from 'react-ace/lib/ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-github'

describe('Editor', () => {

  // Required for the document.getElementById used by Ace can work in the test environment
  const domElement = document.getElementById('app');
  const mountOptions = {
    attachTo: domElement,
  };

  it('Editor component should render AceEditor markers', () => {
    const markers = [{
      startRow: 3,
      startCol: 0,
      endRow: 3,
      endCol: 10,
      type: 'text',
      className: 'test-marker'
    }];
    const wrapper = mount(<AceEditor markers={markers} mode='javascript' theme='github' />, mountOptions);

    // Read the markers
    const editor: AceEditorClass = (wrapper.instance() as ReactAce).editor;
    expect(editor.getSession().getMarkers()['3'].clazz).toBe('test-marker');
    expect(editor.getSession().getMarkers()['3'].type).toBe('text');
  });
});