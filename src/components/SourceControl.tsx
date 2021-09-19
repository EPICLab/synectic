import React, { useEffect, useState } from 'react';
import { InsertDriveFile, Add, Remove } from '@material-ui/icons';
import { TreeView } from '@material-ui/lab';
import type { Card, GitStatus, Metafile, Repository, UUID } from '../types';
import { RootState } from '../store/store';
import { BranchRibbon } from './BranchRibbon';
import { StyledTreeItem } from './StyledTreeComponent';
import { MetafileWithPath } from '../containers/metafiles';
import { extractFilename } from '../containers/io';
import { add, remove } from '../containers/git-plumbing';
import { GitBranchIcon } from './GitIcons';
import { useAppSelector } from '../store/hooks';
import { metafileSelectors } from '../store/selectors/metafiles';
import { repoSelectors } from '../store/selectors/repos';
import useDirectory from '../containers/hooks/useDirectory';

const modifiedCheck = (status: GitStatus | undefined): boolean => {
  if (!status) return false;
  // should be same as MatrixStatus results from:
  //    !(status[0] === status[1] && status[1] === status[2]);
  return !['absent', 'unmodified', 'ignored'].includes(status);
}

const changedCheck = (status: GitStatus | undefined): boolean => {
  if (!status) return false;
  // should be same as MatrixStatus results from:
  //    matrixToStatus({ status: status })?.charAt(0) === '*';
  return ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(status);
}

const stagedCheck = (status: GitStatus | undefined): boolean => {
  if (!status) return false;
  return modifiedCheck(status) && !changedCheck(status);
}

type SourceFileProps = {
  repository: Repository,
  update: () => Promise<void>
}

const SourceFileComponent: React.FunctionComponent<Metafile & SourceFileProps> = props => {

  const colorFilter = (status: GitStatus | undefined) =>
  (status && stagedCheck(status) ? '#61aeee'
    : (status && changedCheck(status) ? '#d19a66' : undefined));

  const iconFilter = (status: GitStatus | undefined) =>
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
          await remove(props.path, props.repository, props.branch);
          await props.update();
        } else if (modifiedCheck(props.status)) {
          console.log(`staging ${extractFilename(props.path)}...`);
          await add(props.path, props.repository, props.branch);
          await props.update();
        }
      }}
    />
  );
}

const SourceControl: React.FunctionComponent<{ rootId: UUID }> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.rootId));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile ? repos.find(r => r.id === metafile.repo) : undefined);
  const { files, update } = useDirectory((metafile as MetafileWithPath).path);
  const [staged, setStaged] = useState<Metafile[]>([]);
  const [changed, setChanged] = useState<Metafile[]>([]);
  const [modified, setModified] = useState<Metafile[]>([]);

  useEffect(() => { setModified(files.filter(f => modifiedCheck(f.status))) }, [files]);
  useEffect(() => { setStaged(files.filter(f => stagedCheck(f.status))) }, [files]);
  useEffect(() => { setChanged(files.filter(f => changedCheck(f.status))) }, [files]);

  return (
    <div className='file-explorer'>
      <BranchRibbon branch={metafile?.branch} onClick={() => {
        console.log({ metafile, files, modified });
      }} />
      <TreeView>
        <StyledTreeItem key={`${repo ? repo.name : ''}-${metafile?.branch}-staged`}
          nodeId={`${repo ? repo.name : ''}-${metafile?.branch}-staged`}
          labelText='Staged'
          labelInfoText={`${staged.length}`}
          labelIcon={GitBranchIcon}
        >
          {staged.map(file =>
            <SourceFileComponent key={file.path.toString()} repository={repo} update={update} {...file} />)
          }
        </StyledTreeItem>
        <StyledTreeItem key={`${repo ? repo.name : ''}-${metafile?.branch}-changed`}
          nodeId={`${repo ? repo.name : ''}-${metafile?.branch}-changed`}
          labelText='Changed'
          labelInfoText={`${changed.length}`}
          labelIcon={GitBranchIcon}
        >
          {changed.map(file =>
            <SourceFileComponent key={file.path.toString()} repository={repo} update={update} {...file} />)}
        </StyledTreeItem>
      </TreeView>
    </div>
  );
}

export const SourceControlReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo = { name: 'Untracked' }] = useState(repos.find(r => r.id === metafile?.repo) || { name: 'Untracked' });
  return (
    <>
      <span>Repo:</span><span className='field'>{repo.name}</span>
      <span>Branch:</span><span className='field'>{metafile?.branch ? metafile.branch : 'untracked'}</span>
    </>
  )
}

export default SourceControl;