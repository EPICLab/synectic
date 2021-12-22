import React, { useMemo, useState } from 'react';
import { TreeView } from '@material-ui/lab';
import type { Card, Metafile } from '../../types';
import { RootState } from '../../store/store';
import { BranchRibbon } from './BranchRibbon';
import { StyledTreeItem } from '../StyledTreeComponent';
import { GitBranchIcon } from '../GitIcons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import useDirectory from '../../containers/hooks/useDirectory';
import { fetchVersionControl, FileMetafile, isFilebasedMetafile } from '../../store/thunks/metafiles';
import { changedCheck, modifiedCheck, SourceFileComponent, stagedCheck } from './SourceFileComponent';
import { fetchRepoById } from '../../store/thunks/repos';
import { add, remove } from '../../containers/git-plumbing';
import { metafileUpdated } from '../../store/slices/metafiles';

const SourceControl: React.FunctionComponent<{ root: Metafile }> = props => {
  const dispatch = useAppDispatch();
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(repos.find(r => r.id === props.root.repo));
  const { files, update } = useDirectory(isFilebasedMetafile(props.root) ? props.root.path : undefined);
  const changed = useMemo(() => files.filter(f => changedCheck(f.status)), [files]);
  const staged = useMemo(() => files.filter(f => stagedCheck(f.status)), [files]);
  const modified = useMemo(() => files.filter(f => modifiedCheck(f.status)), [files]);

  const stage = async (metafile: FileMetafile) => {
    const repo = metafile.repo ? await dispatch(fetchRepoById(metafile.repo)).unwrap() : undefined;
    if (repo && metafile.branch) {
      await add(metafile.path, repo, metafile.branch);
      const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
      dispatch(metafileUpdated({ ...metafile, ...vcs }));
    }
    update();
  };

  const unstage = async (metafile: FileMetafile) => {
    const repo = metafile.repo ? await dispatch(fetchRepoById(metafile.repo)).unwrap() : undefined;
    if (repo && metafile.branch) {
      await remove(metafile.path, repo, metafile.branch);
      const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
      dispatch(metafileUpdated({ ...metafile, ...vcs }));
    }
    update();
  };

  return (
    <>
      {props.root.branch ?
        <div className='list-component'>
          <BranchRibbon branch={props.root.branch} onClick={() => {
            console.log({ props, files, modified });
          }} />
          <TreeView
            expanded={[`${repo ? repo.name : ''}-${props.root.branch}-staged`, `${repo ? repo.name : ''}-${props.root.branch}-changed`]}
          >
            <StyledTreeItem key={`${repo ? repo.name : ''}-${props.root.branch}-staged`}
              nodeId={`${repo ? repo.name : ''}-${props.root.branch}-staged`}
              labelText='Staged'
              labelInfoText={`${staged.length}`}
              labelIcon={GitBranchIcon}
            >
              {repo ? staged.filter(isFilebasedMetafile).map(file =>
                <SourceFileComponent key={file.path.toString()} repository={repo} update={() => unstage(file)} {...file} />)
                : null
              }
            </StyledTreeItem>
            <StyledTreeItem key={`${repo ? repo.name : ''}-${props.root.branch}-changed`}
              nodeId={`${repo ? repo.name : ''}-${props.root.branch}-changed`}
              labelText='Changed'
              labelInfoText={`${changed.length}`}
              labelIcon={GitBranchIcon}
            >
              {repo ? changed.filter(isFilebasedMetafile).map(file =>
                <SourceFileComponent key={file.path.toString()} repository={repo} update={() => stage(file)} {...file} />)
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

export default SourceControl;