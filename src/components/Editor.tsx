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

import type { Card, Metafile } from '../types';
import { RootState } from '../store/store';
import { metafileUpdated } from '../store/slices/metafiles';
import metafileSelectors from '../store/selectors/metafiles';
import repoSelectors from '../store/selectors/repos';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import useGitWatcher from '../containers/hooks/useGitWatcher';
import { BranchList } from './BranchList';
import { removeUndefinedProperties } from '../containers/format';
import { Button, Typography } from '@material-ui/core';
import { SourceControlButton } from './SourceControl';
import { isFilebasedMetafile, revertStagedChanges } from '../store/thunks/metafiles';

const Editor: React.FunctionComponent<{ metafile: Metafile }> = props => {
  const [code, setCode] = useState<string>(props.metafile.content ? props.metafile.content : '');
  const [editorRef] = useState(React.createRef<AceEditor>());
  const dispatch = useAppDispatch();
  useGitWatcher(props.metafile.path);
  useEffect(() => { onChange(props.metafile.content) }, [props.metafile]);

  const onChange = async (newCode: string | undefined) => {
    if (newCode && code !== newCode) {
      setCode(newCode);
      dispatch(metafileUpdated({ ...props.metafile, content: newCode, state: 'modified' }));
    }
  };

  const mode = removeUndefinedProperties({ mode: props.metafile.filetype?.toLowerCase() });

  return (
    <AceEditor {...mode} theme='monokai' onChange={onChange} name={props.metafile.id + '-editor'} value={code}
      ref={editorRef} className='editor' height='100%' width='100%' showGutter={false}
      setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
  );
}

export const RevertButton: React.FunctionComponent<Metafile> = props => {
  const dispatch = useAppDispatch();
  const revert = async () => isFilebasedMetafile(props) ? await dispatch(revertStagedChanges(props)) : undefined;
  const changes = props.path && props.status && ['*added', 'added', '*deleted', 'deleted', '*modified', 'modified'].includes(props.status) ? true : false;
  return (<Button onClick={revert} disabled={!changes}>Undo Changes</Button>)
}

export const EditorReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);

  return (
    <>
      <span><Typography variant='body2'>ID:</Typography></span><span className='field'><Typography variant='body2'>...{props.id.slice(-10)}</Typography></span>
      <span><Typography variant='body2'>Metafile:</Typography></span><span className='field'><Typography variant='body2'>...{props.metafile.slice(-10)}</Typography></span>
      <span><Typography variant='body2'>Name:</Typography></span><span className='field'><Typography variant='body2'>{props.name}</Typography></span>
      <span><Typography variant='body2'>Update:</Typography></span><span className='field'><Typography variant='body2'>{DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)}</Typography></span>
      <span><Typography variant='body2'>Changes:</Typography></span>{metafile ? <RevertButton {...metafile} /> : undefined}
      <span><Typography variant='body2'>Repo:</Typography></span><span className='field'><Typography variant='body2'>{repo ? repo.name : 'Untracked'}</Typography></span>
      {repo ?
        <>
          <span>Branch:</span>{metafile ? <BranchList metafileId={metafile.id} cardId={props.id} /> : undefined}
          <span>Status:</span><span className='field'><Typography variant='body2'>{metafile ? metafile.status : ''}</Typography></span>
          <span>Versions:</span>{metafile ? <SourceControlButton repoId={repo.id} metafileId={metafile.id} /> : undefined}
        </>
        : undefined}
    </>
  );
};

export default Editor;