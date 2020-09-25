import React from 'react';
import { mount } from 'enzyme';
import * as ace from 'ace-builds'; // ace module
ace.config.set('basePath', '');
ace.config.set('modePath', '');
ace.config.set('themePath', '');
import AceEditor from 'react-ace';
import ReactAce from 'react-ace/lib/ace';
import { IAceEditor } from 'react-ace/lib/types';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { fireEvent, render, screen } from '@testing-library/react';

import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { mockStore } from './__mocks__/reduxStoreMock';
import Editor, { EditorReverse } from '../src/components/Editor';

describe('Editor', () => {

  // Required for the document.getElementById used by Ace can work in the test environment
  const domElement = document.getElementById('app');
  const mountOptions = {
    attachTo: domElement,
  };

  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: [],
      cards: ['57'],
      stacks: []
    },
    stacks: {},
    cards: {
      57: {
        id: '57',
        name: 'virtual.js',
        type: 'Editor',
        metafile: '199',
        created: DateTime.fromISO('1997-12-27T10:10:10.288-08:00'),
        modified: DateTime.fromISO('1998-01-01T20:20:20.144-08:00'),
        captured: false,
        left: 27,
        top: 105
      }
    },
    filetypes: {},
    metafiles: {
      199: {
        id: '199',
        name: 'virtual.js',
        modified: DateTime.fromISO('2020-06-25T04:19:55.309-08:00'),
        handler: 'Editor',
        content: 'beep-boop'
      },
    },
    repos: {},
    errors: {}
  });

  afterEach(store.clearActions);

  it('Editor component should work', () => {
    const EditorContext = wrapInReduxContext(Editor, store);
    const wrapper = mount(<EditorContext metafileId='199' />, mountOptions);
    const component = wrapper.find(Editor).first();
    expect(component).toBeDefined();
  });

  it('Editor component should render AceEditor markers', () => {
    const EditorContext = wrapInReduxContext(Editor, store);
    const wrapper = mount(<EditorContext metafileId='199' />, mountOptions);
    const editor: IAceEditor = (wrapper.find(AceEditor).first().instance() as ReactAce).editor;
    const range: ace.Ace.Range = new ace.Range(3, 0, 3, 10);
    editor.getSession().addMarker(range, 'test-marker', 'text');
    const markers = editor.getSession().getMarkers();

    expect(markers[3].clazz).toBe('test-marker');
    expect(markers[3].type).toBe('text');
    expect(editor.getSession().getMarkers()).toMatchSnapshot();
  });

  it('Editor component should let the user enter/edit text', () => {
    const EditorContext = wrapInReduxContext(Editor, store);
    render(<EditorContext metafileId='199' />);
    const textBox = screen.queryByRole('textbox');

    if (textBox instanceof HTMLInputElement) {
      expect(textBox.value).toBe("beep-boop");

      fireEvent.click(textBox);
      fireEvent.change(textBox, { target: { value: 'var foo = 5;' } });

      expect(textBox.value).toBe("var foo = 5;");
    }
  });

  it('Editor component should have a working reverse side', () => {
    const EditorReverseContext = wrapInReduxContext(EditorReverse, store);
    const card = store.getState().cards?.["57"];
    const wrapper = mount(<EditorReverseContext {...card} />, mountOptions);
    const component = wrapper.find(EditorReverse).first();
    expect(component).toBeDefined();
  });
});