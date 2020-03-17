import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/root';
import { UUID } from '../types';
import 'ace-builds';
import AceEditor from 'react-ace';
/* webpack-resolver incorrectly resolves basePath for file-loader unless at least one mode has already been loaded, 
thus the following javascript mode file is loaded to fix this bug */
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/webpack-resolver'; // resolver for dynamically loading modes, requires webpack file-loader module
import { ActionKeys } from '../store/actions';

const Editor: React.FunctionComponent<{ metafileId: UUID }> = props => {
  const metafile = useSelector((state: RootState) => state.metafiles[props.metafileId]);
  const [code, setCode] = useState<string>(metafile.content ? metafile.content : '');
  const [editorRef] = useState(React.createRef<AceEditor>());
  const dispatch = useDispatch();

  const onChange = (newCode: string) => {
    setCode(newCode);
    dispatch({
      type: ActionKeys.UPDATE_METAFILE,
      id: metafile.id,
      metafile: { ...metafile, content: newCode }
    });
  };

  return (
    <AceEditor mode={metafile.filetype?.toLowerCase()} theme='monokai' onChange={onChange} name={metafile.id + '-editor'} value={code}
      ref={editorRef} className='editor' height='calc(100% - 29px)' width='100%' showGutter={false}
      setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
  );
}

export default Editor;