import React, { useState } from 'react';
import 'ace-builds';
import AceEditor from 'react-ace';
/* webpack-resolver incorrectly resolves basePath for file-loader unless at least one mode has already been loaded, 
thus the following javascript mode file is loaded to fix this bug */
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/webpack-resolver'; // resolver for dynamically loading modes, requires webpack file-loader module

type EditorProps = {
  uuid: string;
  code: string;
  mode: string;
}

const Editor: React.FunctionComponent<EditorProps> = props => {
  const [code, setCode] = useState<string>(props.code);
  const [editorRef] = useState(React.createRef<AceEditor>());

  const onChange = (newCode: string) => {
    setCode(newCode);
    // console.log('change', newValue);
  }

  return (
    <AceEditor mode={props.mode} theme='monokai' onChange={onChange} name={props.uuid} value={code}
      ref={editorRef} className='editor' height='calc(100% - 49px)' width='100%' showGutter={false}
      setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
  );
}

export default Editor;