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
import type { Card, UUID } from '../../types';
import { RootState } from '../../store/store';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeUndefinedProperties } from '../../containers/format';
import { metafileUpdated } from '../../store/slices/metafiles';
import RevertButton from '../RevertButton';
import CommitButton from '../CommitButton';
import { BranchList } from '../SourceControl/BranchList';
import { SourceControlButton } from '../SourceControl/SourceControlButton';
import DataField from '../Card/DataField';

const Editor: React.FunctionComponent<{ metafileId: UUID }> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
  const [code, setCode] = useState(metafile && metafile.content ? metafile.content : '');
  const [editorRef] = useState(React.createRef<AceEditor>());
  const dispatch = useAppDispatch();

  useEffect(() => (metafile && metafile.content) ? setCode(metafile.content) : undefined, [metafile]);

  const onChange = async (newCode: string | undefined) => {
    setCode(newCode ? newCode : '');
    if (metafile) {
      if (newCode !== metafile.content) dispatch(metafileUpdated({ ...metafile, content: newCode ? newCode : '', state: 'modified' }));
      else dispatch(metafileUpdated({ ...metafile, content: newCode ? newCode : '', state: 'unmodified' }));
    }
  };

  const mode = removeUndefinedProperties({ mode: metafile?.filetype?.toLowerCase() });

  return (
    <>
      <AceEditor {...mode} theme='monokai' onChange={onChange} name={props.metafileId + '-editor'} value={code}
        ref={editorRef} className='editor' height='100%' width='100%' showGutter={false}
        setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
    </>
  );
}

export const EditorReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);
  const sourceButton = false;

  return (
    <>
      <div className='buttons'>
        <RevertButton cardIds={[props.id]} mode='dark' />
        <CommitButton cardIds={[props.id]} mode='dark' />
        {metafile && repo && sourceButton ? <SourceControlButton repoId={repo.id} metafileId={metafile.id} /> : undefined}
      </div>
      <DataField title='UUID' textField field={props.id} />
      <DataField title='Path' textField field={metafile?.path?.toString()} />
      <DataField title='Update' textField field={DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)} />
      <DataField title='State' textField field={metafile ? metafile.state : ''} />
      <DataField title='Repo' textField field={repo ? repo.name : 'Untracked'} />
      {repo && metafile ?
        <>
          <DataField title='Status' textField field={metafile.conflicts && metafile.conflicts?.length > 0 ? `${metafile.status} [CONFLICT]` : metafile.status} />
          <DataField title='Branch' field={<BranchList cardId={props.id} />} />
        </>
        : undefined}
    </>
  );
};

export default Editor;