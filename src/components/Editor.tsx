import React from 'react';
import JavascriptEditor from './LoadableEditors/javascriptEditor';
import PythonEditor from './LoadableEditors/pythonEditor';

type EditorProps = {
  uuid: string;
  code: string;
  mode: string;
}

const Editor: React.FunctionComponent<EditorProps> = props => {
  return (
    <div>
      {props.mode === 'javascript' && <JavascriptEditor {...props} />}
      {props.mode === 'python' && <PythonEditor {...props} />}
    </div>
  )
}

export default Editor;