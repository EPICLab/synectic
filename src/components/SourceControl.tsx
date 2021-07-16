import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { InsertDriveFile, Add, Remove } from '@material-ui/icons';
import { TreeView } from '@material-ui/lab';

import type { Card, Metafile, Repository, UUID } from '../types';
import { Action, ActionKeys } from '../store/actions';
import { RootState } from '../store/root';
import { BranchRibbon } from './BranchRibbon';
import { StyledTreeItem } from './StyledTreeComponent';
import { HookEntry, MatrixStatus } from '../store/hooks/useDirectory';
import { MetafileWithPath } from '../containers/metafiles';
import { extractFilename, isDirectory, readDirAsyncDepth } from '../containers/io';
import { add, matrixToStatus, remove } from '../containers/git-plumbing';
import { GitBranchIcon } from './GitIcons';
import { PathLike } from 'fs-extra';
import path from 'path';
import { flattenArray } from '../containers/flatten';

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
          await props.update();
          dispatch({
            type: ActionKeys.UPDATE_REPO,
            id: props.repo.id,
            repo: props.repo
          })
        } else if (modifiedCheck(props.status)) {
          console.log(`staging ${extractFilename(props.path)}...`);
          await add(props.path, props.repo, props.branch);
          await props.update();
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

// splits filepaths into directory and file entry lists
const filterPaths = async (filepaths: PathLike[]): Promise<{ directories: PathLike[], files: PathLike[] }> => {
  return await filepaths.reduce(async (previousPromise: Promise<{ directories: PathLike[], files: PathLike[] }>, filepath: PathLike) => {
    const collection = await previousPromise;
    if (await isDirectory(filepath)) collection.directories.push(filepath);
    else collection.files.push(filepath);
    return collection;
  }, Promise.resolve({ directories: [], files: [] }));
};

const descendDirectory = (rootMetafile: MetafileWithPath):
  ThunkAction<Promise<{ files: Metafile[], directories: Metafile[] }>, RootState, undefined, Action> => {
  return async (_, getState) => {
    const filepaths = (await readDirAsyncDepth(rootMetafile.path, 1)).filter(p => p !== rootMetafile.path); // filter root filepath from results
    const currPaths = await filterPaths(filepaths);
    const findMetafile = (targetPath: PathLike) => Object.values(getState().metafiles)
      .filter(m => m.path !== undefined)
      .filter(m => m.path ? path.relative(m.path.toString(), targetPath.toString()) === '' : false);
    const files = flattenArray(currPaths.files.map(f => findMetafile(f)));
    const directories = flattenArray(currPaths.directories.map(d => findMetafile(d)));
    return new Promise((resolve) => resolve({ files: files, directories: directories }));
  }
}

const SourceControl: React.FunctionComponent<{ rootId: UUID }> = props => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();
  const metafile = useSelector((state: RootState) => state.metafiles[props.rootId]);
  const repos = useSelector((state: RootState) => state.repos);
  const [repo] = useState(metafile.repo ? repos[metafile.repo] : undefined);
  const { files, directories } = await dispatch(descendDirectory(metafile as MetafileWithPath));

  const [staged, setStaged] = useState<HookEntry[]>([]);
  const [changed, setChanged] = useState<HookEntry[]>([]);
  const [modified, setModified] = useState<HookEntry[]>([]);

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

function dispatch(arg0: ThunkAction<Promise<{ files: Metafile[]; directories: Metafile[]; }>, import("redux").CombinedState<{ canvas: import("../types").Canvas; stacks: { [id: string]: import("../types").Stack; }; cards: { [id: string]: Card; }; filetypes: { ...; }; metafiles: { ...; }; repos: { ...; }; modals: { ...; }; }>, undefined, Action >): { files: any; directories: any; } {
  throw new Error('Function not implemented.');
}
