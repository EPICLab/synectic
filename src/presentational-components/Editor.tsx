import React from 'react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';

type EditorProps = {
  uuid: string;
  code: string;
}

function onChange(newValue: string) {
  console.log('change', newValue);
}

const Editor: React.FunctionComponent<EditorProps> = props => {

  return (
    <AceEditor mode='javascript' theme='monokai' onChange={onChange} name={props.uuid} value={props.code}
      className='editor' height='calc(100% - 29px)' width='100%' setOptions={{ useWorker: false }} />
  );
}

export default Editor;