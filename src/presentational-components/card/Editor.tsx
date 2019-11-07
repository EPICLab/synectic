/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
// eslint-disable-next-line import/named
import MonacoEditor, { MonacoEditorProps } from 'react-monaco-editor';

type EditorState = {
  code: string;
}

export class Editor extends React.Component<MonacoEditorProps, EditorState> {
  constructor(props: MonacoEditorProps) {
    super(props);
    this.state = {
      code: '// type your code here...'
    };
  }

  editorDidMount(editor: any) {
    console.log('editorDidMount', editor);
    editor.focus();
  }

  onChange(newValue: string, e: any) {
    console.log('onChange', newValue, e);
  }

  render() {
    const code = this.state.code;
    const options = {
      selectOnLineNumbers: true
    };

    return (
      <MonacoEditor language='javascript' theme='vs-dark' value={code} options={options} />
    );
  }
}