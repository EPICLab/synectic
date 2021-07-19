import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { InsertDriveFile, Add, Remove } from '@material-ui/icons';
import { TreeView } from '@material-ui/lab';

import type { Card, GitStatus, Repository, UUID } from '../types';
import { Action, ActionKeys } from '../store/actions';
import { RootState } from '../store/root';
import { BranchRibbon } from './BranchRibbon';
import { StyledTreeItem } from './StyledTreeComponent';
import { HookEntry, MatrixStatus } from '../store/hooks/useDirectory';
import { extractFilename } from '../containers/io';
import { add, matrixToStatus, remove } from '../containers/git-plumbing';
import { GitBranchIcon } from './GitIcons';
import { getMetafilesByRoot } from '../store/selectors/metafiles';
import { MetafileWithPath } from '../containers/metafiles';

const modifiedCheck = (status: MatrixStatus | undefined): boolean => {
  if (!status) return false;
  return !(status[0] === status[1] && status[1] === status[2]);
}

const modifiedValidate = (status: GitStatus | undefined): boolean => {
  if (!status) return false;
  return !(status === 'ignored' || status === 'unmodified' || status === 'absent' || status === '*absent');
} 

const changedCheck = (status: MatrixStatus | undefined): boolean => {
  if (!status) return false;
  return matrixToStatus({ status: status })?.charAt(0) === '*';
}

const changedValidate = (status: GitStatus | undefined): boolean => {
  if (!status) return false;
  return (status.charAt(0) === '*')
}

const stagedCheck = (status: MatrixStatus | undefined): boolean => {
  if (!status) return false;
  return modifiedCheck(status) && !changedCheck(status);
}

const stagedValidate = (status: GitStatus | undefined): boolean => {
  if (!status) return false;
  return modifiedValidate(status) && !changedValidate(status);
}

type SourceFileProps = {
  repo?: Repository,
  branch?: string
}

export const SourceFileComponent: React.FunctionComponent<HookEntry & SourceFileProps> = props => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();
  // const modifiedStatus = useState<boolean>(modifiedCheck(props.status) ? modifiedCheck(props.status) : false);

  const colorFilter = (status: MatrixStatus | undefined) =>
  (status && stagedCheck(status) ? '#61aeee'
    : (status && changedCheck(status) ? '#d19a66' : undefined));

  const iconFilter = (status: MatrixStatus | undefined) =>
  (status && stagedCheck(status) ? Remove
    : (status && changedCheck(status) ? Add : undefined));

  return (
    <StyledTreeItem key={props.path.toString()} nodeId={props.path.toString()}
      color={colorFilter(props.status)}
      labelText={extractFilename(props.path)}
      labelIcon={InsertDriveFile}
      labelInfo={iconFilter(props.status)}
      enableHover={true}
      labelInfoClickHandler={async () => {
        if (!props.status || !props.repo || !props.branch) {
          console.log('cannot do anything with an unmodified file');
          return;
        }
        if (stagedCheck(props.status)) {
          console.log(`unstaging ${extractFilename(props.path)}...`);
          await remove(props.path, props.repo, props.branch);
          dispatch({
            type: ActionKeys.UPDATE_REPO,
            id: props.repo.id,
            repo: props.repo
          })
        } else if (modifiedCheck(props.status)) {
          console.log(`staging ${extractFilename(props.path)}...`);
          await add(props.path, props.repo, props.branch);
          dispatch({
            type: ActionKeys.UPDATE_REPO,
            id: props.repo.id,
            repo: props.repo
          })
        }
      }}
    />
  );
}



const SourceControl: React.FunctionComponent<{ rootId: UUID }> = props => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();
  const metafile = useSelector((state: RootState) => state.metafiles[props.rootId]);
  const repos = useSelector((state: RootState) => state.repos);
  const [repo] = useState(metafile.repo ? repos[metafile.repo] : undefined);
  
  // const [staged, setStaged] = useState<HookEntry[]>([]);
  // const [changed, setChanged] = useState<HookEntry[]>([]);
  // const [modified, setModified] = useState<HookEntry[]>([]);

  // useEffect(() => { setModified(files.filter(f => modifiedCheck(f.status))) }, [files]);
  // useEffect(() => { setStaged(files.filter(f => stagedCheck(f.status))) }, [files]);
  // useEffect(() => { setChanged(files.filter(f => changedCheck(f.status))) }, [files]);

  return (
    <div className='file-explorer'>
      <BranchRibbon branch={metafile.branch} onClick={() => {
        dispatch(getMetafilesByRoot((metafile as MetafileWithPath).path))
          .unwrap()
          .then(res => console.log(JSON.stringify(res)))
          .catch(err => console.error(err));
      }} />
      <TreeView>
        <StyledTreeItem key={`${repo ? repo.name : ''}-${metafile.branch}-staged`}
          nodeId={`${repo ? repo.name : ''}-${metafile.branch}-staged`}
          labelText='Staged'
          // labelInfoText={`${staged.length}`}
          labelIcon={GitBranchIcon}
        >
          {/* {staged.map(file =>
            <SourceFileComponent key={file.path.toString()} repo={repo} branch={metafile.branch} {...file} />)
          } */}
        </StyledTreeItem>
        <StyledTreeItem key={`${repo ? repo.name : ''}-${metafile.branch}-changed`}
          nodeId={`${repo ? repo.name : ''}-${metafile.branch}-changed`}
          labelText='Changed'
          // labelInfoText={`${changed.length}`}
          labelIcon={GitBranchIcon}
        >
          {/* {changed.map(file =>
            <SourceFileComponent key={file.path.toString()} repo={repo} branch={metafile.branch} {...file} />)} */}
        </StyledTreeItem>
      </TreeView>
    </div>
  );
}

export const SourceControlReverse: React.FunctionComponent<Card> = props => {
  const metafile = useSelector((state: RootState) => state.metafiles[props.metafile]);
  const repos = useSelector((state: RootState) => state.repos);
  const [repo] = useState(metafile.repo ? repos[metafile.repo] : { name: 'Untracked' });
  return (
    <>
      <span>Repo:</span><span className='field'>{repo.name}</span>
      <span>Branch:</span><span className='field'>{metafile.branch ? metafile.branch : 'untracked'}</span>
    </>
  )
}

export default SourceControl;

