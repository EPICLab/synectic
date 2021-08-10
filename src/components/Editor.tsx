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

import type { UUID, Card } from '../types';
import { RootState } from '../store/store';
import { BranchList } from './BranchList';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectAllMetafiles } from '../store/selectors/metafiles';
import { metafileUpdated } from '../store/slices/metafiles';
import { selectAllRepos } from '../store/selectors/repos';

const Editor: React.FunctionComponent<{ metafileId: UUID }> = props => {
  const metafile = useAppSelector((state: RootState) => selectAllMetafiles.selectById(state, props.metafileId));
  const [code, setCode] = useState<string>(metafile?.content ? metafile.content : '');
  const [editorRef] = useState(React.createRef<AceEditor>());
  const dispatch = useAppDispatch();

  const onChange = (newCode: string) => {
    setCode(newCode);
    if (metafile) {
      dispatch(metafileUpdated({ ...metafile, content: newCode, state: 'modified' }));
    }
  };

  return (
    <AceEditor mode={metafile && metafile.filetype?.toLowerCase()} theme='monokai' onChange={onChange} name={metafile && metafile.id + '-editor'} value={code}
      ref={editorRef} className='editor' height='100%' width='100%' showGutter={false}
      setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
  );
}

export const EditorReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => selectAllMetafiles.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => selectAllRepos.selectAll(state));
  const [repo] = useState(metafile.repo ? repos[metafile.repo] : { name: 'Untracked' });

  return (
    <>
      <span>ID:</span><span className='field'>...{props.id.slice(-10)}</span>
      <span>Metafile:</span><span className='field'>...{props.metafile.slice(-10)}</span>
      <span>Name:</span><span className='field'>{props.name}</span>
      <span>Update:</span><span className='field'>{props.modified.toLocaleString()}</span>
      <span>Repo:</span><span className='field'>{repo.name}</span>
      <span>Branch:</span><BranchList metafileId={metafile.id} cardId={props.id} />
      <span>Status:</span><span className='field'>{metafile.status}</span>
    </>
  );
};

export default Editor;