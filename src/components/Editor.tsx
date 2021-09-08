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
import { metafileSelectors } from '../store/selectors/metafiles';
import { metafileUpdated } from '../store/slices/metafiles';
import { repoSelectors } from '../store/selectors/repos';
import { DateTime } from 'luxon';
import { getMetafile } from '../containers/metafiles';

const Editor: React.FunctionComponent<{ metafileId: UUID }> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
  const [code, setCode] = useState<string>(metafile?.content ? metafile.content : '');
  const [editorRef] = useState(React.createRef<AceEditor>());
  const dispatch = useAppDispatch();

  const onChange = async (newCode: string) => {
    setCode(newCode);
    if (metafile) {
      console.log(`Editor.onChange for metafile: ${metafile.id}`);
      await dispatch(metafileUpdated({ ...metafile, content: newCode, state: 'modified' }));
      const newMetafile = await dispatch(getMetafile({ id: metafile.id }));
      console.log(`OLD: ${JSON.stringify(metafile, undefined, 2)}`);
      console.log(`NEW: ${JSON.stringify(newMetafile, undefined, 2)}`);
    }
  };

  return (
    <AceEditor mode={metafile?.filetype?.toLowerCase()} theme='monokai' onChange={onChange} name={metafile?.id + '-editor'} value={code}
      ref={editorRef} className='editor' height='100%' width='100%' showGutter={false}
      setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
  );
}

export const EditorReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : { name: 'Untracked' });

  return (
    <>
      <span>ID:</span><span className='field'>...{props.id.slice(-10)}</span>
      <span>Metafile:</span><span className='field'>...{props.metafile.slice(-10)}</span>
      <span>Name:</span><span className='field'>{props.name}</span>
      <span>Update:</span><span className='field'>{DateTime.fromMillis(props.modified).toLocaleString()}</span>
      <span>Repo:</span><span className='field'>{repo ? repo.name : ''}</span>
      <span>Branch:</span>{metafile ? <BranchList metafileId={metafile.id} cardId={props.id} /> : undefined}
      <span>Status:</span><span className='field'>{metafile ? metafile.status : ''}</span>
    </>
  );
};

export default Editor;