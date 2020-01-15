import React from 'react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-searchbox';

type EditorProps = {
  uuid: string;
  code: string;
  mode: string;
}

const JavaScriptEditor: React.FunctionComponent<EditorProps> = props => {

  function onChange(newValue: string) {
    console.log('change', newValue);
  }

  return (
    <AceEditor mode='javascript' theme='monokai' onChange={onChange} name={props.uuid} value={props.code}
      className='editor' height='calc(100% - 29px)' width='100%' showGutter={false} setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
  );
}

export default JavaScriptEditor;