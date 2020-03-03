import React from 'react';
import { mount } from 'enzyme';
import * as ace from 'ace-builds'; // ace module
ace.config.set('basePath', '');
ace.config.set('modePath', '');
ace.config.set('themePath', '');

// import 'ace-builds';
// import AceEditor from 'react-ace';
// import { AceEditorClass } from 'react-ace/lib/AceEditorClass';
// import ReactAce from 'react-ace/lib/ace';
// import 'ace-builds/src-noconflict/mode-javascript';
// import 'ace-builds/src-noconflict/theme-github'
import { wrapInTestContext } from './__mocks__/dndReduxMock';
import { createStore, combineReducers } from 'redux';
import { DateTime } from 'luxon';
import Editor from '../src/components/Editor';
import { metafileReducer } from '../src/store/reducers/metafiles';

describe('Editor', () => {

  // Required for the document.getElementById used by Ace can work in the test environment
  const domElement = document.getElementById('app');
  const mountOptions = {
    attachTo: domElement,
  };
  const rootReducer = combineReducers({ metafiles: metafileReducer });
  const initialState = {
    metafiles: {
      '13': {
        id: '13',
        name: 'test.js',
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00')
      }
    }
  };

  const store = createStore(rootReducer, initialState);

  // it('Editor component should render AceEditor markers', () => {
  //   const markers = [{
  //     startRow: 3,
  //     startCol: 0,
  //     endRow: 3,
  //     endCol: 10,
  //     type: 'text',
  //     className: 'test-marker'
  //   }];
  //   const wrapper = mount(<AceEditor markers={markers} mode='javascript' theme='github' />, mountOptions);

  //   // Read the markers
  //   const editor: AceEditorClass = (wrapper.instance() as ReactAce).editor;
  //   expect(editor.getSession().getMarkers()['3'].clazz).toBe('test-marker');
  //   expect(editor.getSession().getMarkers()['3'].type).toBe('text');
  // });

  it('Editor component should work', () => {
    const EditorContext = wrapInTestContext(Editor, store);
    const wrapper = mount(<EditorContext metafileId='13' />, mountOptions);
    const component = wrapper.find(Editor).first();
    expect(component).toBeDefined();
  });
});