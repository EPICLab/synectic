import React, { useEffect, useState } from 'react';
import { InsertDriveFile, Add, Remove } from '@material-ui/icons';
import { Button } from '@material-ui/core';
import { TreeView } from '@material-ui/lab';
import { PathLike } from 'fs-extra';
import type { Card, CardType, GitStatus, Metafile, Repository, UUID } from '../types';
import { RootState } from '../store/store';
import { BranchRibbon } from './BranchRibbon';
import { StyledTreeItem } from './StyledTreeComponent';
import { getMetafile, isMetafilePathed, MetafileWithPath } from '../containers/metafiles';
import { extractFilename } from '../containers/io';
import { add, remove } from '../containers/git-plumbing';
import { GitBranchIcon } from './GitIcons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { metafileSelectors } from '../store/selectors/metafiles';
import { repoSelectors } from '../store/selectors/repos';
import useDirectory from '../containers/hooks/useDirectory';
import { getBranchRoot } from '../containers/git-porcelain';
import { loadCard } from '../containers/handlers';
import { removeUndefinedProperties } from '../containers/format';

const modifiedCheck = (status: GitStatus | undefined): boolean => {
  if (!status) return false;
  return !['absent', 'unmodified', 'ignored'].includes(status);
}

const changedCheck = (status: GitStatus | undefined): boolean => {
  if (!status) return false;
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

  const optionals = removeUndefinedProperties({ color: colorFilter(props.status), labelInfo: iconFilter(props.status) });

  return (
    <>
      {props.path ? <StyledTreeItem key={props.path.toString()} nodeId={props.path.toString()}
        labelText={extractFilename(props.path)}
        labelIcon={InsertDriveFile}
        {...optionals}
        enableHover={true}
        labelInfoClickHandler={async () => {
          if (!props.status || !props.repo || !props.branch || !props.path) {
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
        : null}
    </>



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
    <>
      {metafile && metafile.branch ?
        <div className='list-component'>
          <BranchRibbon branch={metafile.branch} onClick={() => {
            console.log({ metafile, files, modified });
          }} />
          <TreeView
            expanded={[`${repo ? repo.name : ''}-${metafile?.branch}-staged`, `${repo ? repo.name : ''}-${metafile?.branch}-changed`]}
          >
            <StyledTreeItem key={`${repo ? repo.name : ''}-${metafile?.branch}-staged`}
              nodeId={`${repo ? repo.name : ''}-${metafile?.branch}-staged`}
              labelText='Staged'
              labelInfoText={`${staged.length}`}
              labelIcon={GitBranchIcon}
            >
              {repo ? staged.filter(isMetafilePathed).map(file =>
                <SourceFileComponent key={file.path.toString()} repository={repo} update={update} {...file} />)
                : null
              }
            </StyledTreeItem>
            <StyledTreeItem key={`${repo ? repo.name : ''}-${metafile?.branch}-changed`}
              nodeId={`${repo ? repo.name : ''}-${metafile?.branch}-changed`}
              labelText='Changed'
              labelInfoText={`${changed.length}`}
              labelIcon={GitBranchIcon}
            >
              {repo ? changed.filter(isMetafilePathed).map(file =>
                <SourceFileComponent key={file.path.toString()} repository={repo} update={update} {...file} />)
                : null
              }
            </StyledTreeItem>
          </TreeView>
        </div>
        : null}
    </>
  );
}

export const SourceControlReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);
  return (
    <>
      <span>Repo:</span><span className='field'>{repo ? repo.name : 'Untracked'}</span>
      <span>Branch:</span><span className='field'>{metafile?.branch ? metafile.branch : 'untracked'}</span>
    </>
  )
}

export const SourceControlButton: React.FunctionComponent<{ repoId: UUID, metafileId: UUID }> = props => {
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repoId));
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
  const dispatch = useAppDispatch();

  const loadSourceControl = async () => {
    if (!repo) {
      console.log(`Repository missing for metafile id:'${props.metafileId}'`);
      return;
    }
    if (!metafile || !metafile.branch) {
      console.log(`Cannot load source control for untracked metafile:'${props.metafileId}'`);
      return;
    }
    const branchRoot = await getBranchRoot(repo, metafile.branch);
    const virtualMetafile: {
      name: string,
      handler: CardType,
      repo: UUID,
      branch: string,
      path: PathLike
    } = {
      name: 'Source Control',
      handler: 'SourceControl',
      repo: repo.id,
      branch: metafile.branch,
      path: branchRoot ? branchRoot : ''
    };

    console.log(`loading Source Control for: repo= ${repo.name}, branch= ${metafile.branch}\n${JSON.stringify(virtualMetafile)}`);
    const sourceControlMetafile = await dispatch(getMetafile({ virtual: virtualMetafile })).unwrap();
    console.log(`sourceControlMetafile:${JSON.stringify(sourceControlMetafile, undefined, 2)}`);
    if (sourceControlMetafile) dispatch(loadCard({ metafile: sourceControlMetafile }));
  }

  return (<Button onClick={loadSourceControl}>Source Control</Button>)
}

export default SourceControl;