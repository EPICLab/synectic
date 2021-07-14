import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { InsertDriveFile, Add, Remove } from '@material-ui/icons';
import { TreeView } from '@material-ui/lab';

import type { Card, Repository, UUID } from '../types';
import { Action, ActionKeys } from '../store/actions';
import { RootState } from '../store/root';
import { BranchRibbon } from './BranchRibbon';
import { StyledTreeItem } from './StyledTreeComponent';
import { HookEntry, MatrixStatus, useDirectory } from '../store/hooks/useDirectory';
import { MetafileWithPath } from '../containers/metafiles';
import { extractFilename } from '../containers/io';
// import { add, matrixToStatus, remove } from '../containers/git-plumbing';
import { matrixToStatus } from '../containers/git-plumbing';
import { GitBranchIcon } from './GitIcons';

const modifiedCheck = (status: MatrixStatus | undefined): boolean => {
  if (!status) return false;
  return !(status[0] === status[1] && status[1] === status[2]);
}

const changedCheck = (status: MatrixStatus | undefined): boolean => {
  if (!status) return false;
  return matrixToStatus({ status: status })?.charAt(0) === '*';
}

const stagedCheck = (status: MatrixStatus | undefined): boolean => {
  if (!status) return false;
  return modifiedCheck(status) && !changedCheck(status);
}

type SourceFileProps = {
  repo?: Repository,
  branch?: string,
  update: () => Promise<void>
}

const SourceFileComponent: React.FunctionComponent<HookEntry & SourceFileProps> = props => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();
  // const modifiedStatus = useState<boolean>(modifiedCheck(props.status) ? modifiedCheck(props.status) : false);

  const colorFilter = (status: MatrixStatus | undefined) =>
  (status && stagedCheck(status) ? '#61aeee'
    : (status && changedCheck(status) ? '#d19a66' : undefined));

  const iconFilter = (status: MatrixStatus | undefined) =>
  (status && stagedCheck(status) ? Remove
    : (status && changedCheck(status) ? Add : undefined));

  const updateCheck = () => {
    if (!props.status || !props.repo || !props.branch) {
      return;
    }
    if (stagedCheck(props.status)) {
      console.log(`unstaging ${extractFilename(props.path)}...`);
      dispatch({
        type: ActionKeys.REMOVE_REPO,
        id: props.repo.id
      })
      dispatch({
        type: ActionKeys.UPDATE_REPO,
        id: props.repo.id,
        repo: props.repo
      })
    } else if (modifiedCheck(props.status)) {
      console.log(`staging ${extractFilename(props.path)}...`);
      dispatch({
        type: ActionKeys.ADD_REPO,
        id: props.repo.id,
        repo: props.repo
      })
      dispatch({
        type: ActionKeys.UPDATE_REPO,
        id: props.repo.id,
        repo: props.repo
      })
    }
  }
    
  return (
    <StyledTreeItem key={props.path.toString()} nodeId={props.path.toString()} onChange={updateCheck}
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
          dispatch({
            type: ActionKeys.REMOVE_REPO,
            id: props.repo.id
          })
          dispatch({
            type: ActionKeys.UPDATE_REPO,
            id: props.repo.id,
            repo: props.repo
          })
        } else if (modifiedCheck(props.status)) {
          console.log(`staging ${extractFilename(props.path)}...`);
          dispatch({
            type: ActionKeys.ADD_REPO,
            id: props.repo.id,
            repo: props.repo
          })
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
  const metafile = useSelector((state: RootState) => state.metafiles[props.rootId]);
  const repos = useSelector((state: RootState) => state.repos);
  const [repo] = useState(metafile.repo ? repos[metafile.repo] : undefined);
  const { files, update } = useDirectory((metafile as MetafileWithPath).path);
  const [staged, setStaged] = useState<HookEntry[]>([]);
  const [changed, setChanged] = useState<HookEntry[]>([]);
  const [modified, setModified] = useState<HookEntry[]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { update() }, []); // initial async call to load/filter sub-directories & files via useDirectory hook
  useEffect(() => { setModified(files.filter(f => modifiedCheck(f.status))) }, [files]);
  useEffect(() => { setStaged(files.filter(f => stagedCheck(f.status))) }, [files]);
  useEffect(() => { setChanged(files.filter(f => changedCheck(f.status))) }, [files]);

  return (
    <div className='file-explorer'>
      <BranchRibbon branch={metafile.branch} onClick={() => {
        console.log({ metafile, files, modified });
        update();
      }} />
      <TreeView>
        <StyledTreeItem key={`${repo ? repo.name : ''}-${metafile.branch}-staged`}
          nodeId={`${repo ? repo.name : ''}-${metafile.branch}-staged`}
          labelText='Staged'
          labelInfoText={`${staged.length}`}
          labelIcon={GitBranchIcon}
        >
          {staged.map(file =>
            <SourceFileComponent key={file.path.toString()} repo={repo} branch={metafile.branch} update={update} {...file} />)
          }
        </StyledTreeItem>
        <StyledTreeItem key={`${repo ? repo.name : ''}-${metafile.branch}-changed`}
          nodeId={`${repo ? repo.name : ''}-${metafile.branch}-changed`}
          labelText='Changed'
          labelInfoText={`${changed.length}`}
          labelIcon={GitBranchIcon}
        >
          {changed.map(file =>
            <SourceFileComponent key={file.path.toString()} repo={repo} branch={metafile.branch} update={update} {...file} />)}
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