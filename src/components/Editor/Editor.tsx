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
import type { Card, Metafile } from '../../types';
import { RootState } from '../../store/store';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { BranchList } from '../SourceControl/BranchList';
import { removeUndefinedProperties } from '../../containers/format';
import { Typography } from '@material-ui/core';
import { SourceControlButton } from '../SourceControl/SourceControlButton';
import { isFilebasedMetafile, revertStagedChanges } from '../../store/thunks/metafiles';
import { metafileUpdated } from '../../store/slices/metafiles';

const Editor: React.FunctionComponent<{ metafile: Metafile }> = props => {
  const [code, setCode] = useState(props.metafile.content ? props.metafile.content : '');
  const [editorRef] = useState(React.createRef<AceEditor>());
  const dispatch = useAppDispatch();

  const onChange = async (newCode: string | undefined) => {
    if (newCode) {
      setCode(newCode);
      if (newCode !== props.metafile.content) dispatch(metafileUpdated({ ...props.metafile, content: newCode, state: 'modified' }));
      else dispatch(metafileUpdated({ ...props.metafile, content: newCode, state: 'unmodified' }));
    }
  };

  const mode = removeUndefinedProperties({ mode: props.metafile.filetype?.toLowerCase() });

  return (
    <>
      <AceEditor {...mode} theme='monokai' onChange={onChange} name={props.metafile.id + '-editor'} value={code}
        ref={editorRef} className='editor' height='100%' width='100%' showGutter={false}
        setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
    </>
  );
}

export const EditorReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);

  useEffect(() => {
    console.log('metafile changed:');
    console.log({ metafile });
  }, [metafile]);

  return (
    <>
      <span><Typography variant='body2'>Name:</Typography></span><span className='field'><Typography variant='body2'>{props.name}</Typography></span>
      <span><Typography variant='body2'>Update:</Typography></span><span className='field'><Typography variant='body2'>{DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)}</Typography></span>
      <span><Typography variant='body2'>State:</Typography></span><span className='field'><Typography variant='body2'>{metafile ? metafile.state : ''}</Typography></span>
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