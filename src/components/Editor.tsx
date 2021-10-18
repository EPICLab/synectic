import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import 'ace-builds';
import AceEditor from 'react-ace';
/* webpack-resolver incorrectly resolves basePath for file-loader unless at least one mode has already been loaded, 
thus the following javascript mode file is loaded to fix this bug */
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/webpack-resolver'; // resolver for dynamically loading modes, requires webpack file-loader module

import type { UUID, Card, Metafile } from '../types';
import { RootState } from '../store/store';
import { metafileUpdated } from '../store/slices/metafiles';
import { metafileSelectors } from '../store/selectors/metafiles';
import { repoSelectors } from '../store/selectors/repos';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import useGitWatcher from '../containers/hooks/useGitWatcher';
import { BranchList } from './BranchList';
import { removeUndefinedProperties } from '../containers/format';
import { Button } from '@material-ui/core';
import { discardMetafileChanges } from '../containers/metafiles';
import { SourceControlButton } from './SourceControl';

const Editor: React.FunctionComponent<{ metafileId: UUID }> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
  const [code, setCode] = useState<string>(metafile?.content ? metafile.content : '');
  const [editorRef] = useState(React.createRef<AceEditor>());
  const dispatch = useAppDispatch();
  useGitWatcher(metafile?.path);
  useEffect(() => { onChange(metafile?.content) }, [metafile]);

  const onChange = async (newCode: string | undefined) => {
    if (metafile && newCode && code !== newCode) {
      setCode(newCode);
      dispatch(metafileUpdated({ ...metafile, content: newCode, state: 'modified' }));
    }
  };

  const mode = removeUndefinedProperties({ mode: metafile?.filetype?.toLowerCase() });

  return (
    <AceEditor {...mode} theme='monokai' onChange={onChange} name={metafile?.id + '-editor'} value={code}
      ref={editorRef} className='editor' height='100%' width='100%' showGutter={false}
      setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
  );
}

export const RevertButton: React.FunctionComponent<Metafile> = props => {
  const dispatch = useAppDispatch();
  const revert = async () => await dispatch(discardMetafileChanges(props));
  const changes = props.path && props.status && ['*added', 'added', '*deleted', 'deleted', '*modified', 'modified'].includes(props.status) ? true : false;
  return (<Button onClick={revert} disabled={!changes}>Undo Changes</Button>)
}

export const EditorReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);

  return (
    <>
      <span>ID:</span><span className='field'>...{props.id.slice(-10)}</span>
      <span>Metafile:</span><span className='field'>...{props.metafile.slice(-10)}</span>
      <span>Name:</span><span className='field'>{props.name}</span>
      <span>Update:</span><span className='field'>{DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)}</span>
      <span>Changes:</span>{metafile ? <RevertButton {...metafile} /> : undefined}
      <span>Repo:</span><span className='field'>{repo ? repo.name : 'Untracked'}</span>
      {repo ?
        <>
          <span>Branch:</span>{metafile ? <BranchList metafileId={metafile.id} cardId={props.id} /> : undefined}
          <span>Status:</span><span className='field'>{metafile ? metafile.status : ''}</span>
          <span>Versions:</span>{metafile ? <SourceControlButton repoId={repo.id} metafileId={metafile.id} /> : undefined}
        </>
        : undefined}
    </>
  );
};

export default Editor;