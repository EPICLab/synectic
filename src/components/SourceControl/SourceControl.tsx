import React from 'react';
import { TreeView } from '@material-ui/lab';
import type { Card, UUID } from '../../types';
import { RootState } from '../../store/store';
import { BranchRibbon } from './BranchRibbon';
import { StyledTreeItem } from '../StyledTreeComponent';
import { GitBranchIcon } from '../GitIcons';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { FileMetafile, isFileMetafile } from '../../store/thunks/metafiles';
import { SourceFileComponent } from './SourceFileComponent';
import branchSelectors from '../../store/selectors/branches';
import { Add, Remove, SvgIconComponent, Warning } from '@material-ui/icons';
import DataField from '../Card/DataField';

export type SourceMotif = {
  color: string | undefined,
  icon: SvgIconComponent | undefined
}

export const conflictedCheck = (metafile: FileMetafile) => metafile.conflicts ? metafile.conflicts.length > 0 : false;
export const stagedCheck = (metafile: FileMetafile) => metafile.status ? ['added', 'modified', 'deleted'].includes(metafile.status) : false;
export const unstagedCheck = (metafile: FileMetafile) => metafile.status ? ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(metafile.status) : false;

export const getSourceMotif = (metafile: FileMetafile): SourceMotif => {
  if (metafile.status) {
    const conflicts = conflictedCheck(metafile);
    const staged = stagedCheck(metafile);
    const unstaged = unstagedCheck(metafile);
    const icon = conflicts ? Warning : staged ? Remove : unstaged ? Add : undefined;
    // #da6473 => red, #61aeee => blue, #d19a66 => orange
    const color = conflicts ? '#da6473' : staged ? '#61aeee' : unstaged ? '#d19a66' : undefined;
    return { color: color, icon: icon };
  }
  return { color: undefined, icon: undefined };
};

const SourceControl: React.FunctionComponent<{ sourceControlId: UUID }> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.sourceControlId));
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile && metafile.repo ? metafile.repo : ''));
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));
  const staged = useAppSelector((state: RootState) => metafileSelectors.selectStagedByBranch(state, branch ? branch.id : ''));
  const unstaged = useAppSelector((state: RootState) => metafileSelectors.selectUnstagedByBranch(state, branch ? branch.id : ''));

  return (
    <>
      {branch ?
        <div className='list-component'>
          <BranchRibbon branch={branch.ref} onClick={() => { console.log({ metafile, branch, staged, unstaged }) }} />
          <TreeView
            expanded={[`${repo ? repo.name : ''}-${branch.ref}-staged`, `${repo ? repo.name : ''}-${branch.ref}-changed`]}
          >
            <StyledTreeItem key={`${repo ? repo.name : ''}-${branch.ref}-staged`}
              nodeId={`${repo ? repo.name : ''}-${branch.ref}-staged`}
              labelText='Staged'
              labelInfoText={`${staged.length}`}
              labelIcon={GitBranchIcon}
            >
              {repo ?
                staged.filter(isFileMetafile).map(file =>
                  <SourceFileComponent key={file.path.toString()} metafileId={file.id} />)
                : null
              }
            </StyledTreeItem>
            <StyledTreeItem key={`${repo ? repo.name : ''}-${branch.ref}-changed`}
              nodeId={`${repo ? repo.name : ''}-${branch.ref}-changed`}
              labelText='Changed'
              labelInfoText={`${unstaged.length}`}
              labelIcon={GitBranchIcon}
            >
              {repo ?
                unstaged.filter(isFileMetafile).map(file =>
                  <SourceFileComponent key={file.path.toString()} metafileId={file.id} />)
                : <span>{JSON.stringify(unstaged)}</span>
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
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile && metafile.repo ? metafile.repo : ''));
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));



  return (
    <>
      <div className='buttons'></div>
      <DataField title='Repo' textField field={repo ? repo.name : 'Untracked'} />
      <DataField title='Branch' textField field={branch ? branch.ref : 'Untracked'} />
    </>
  )
}

export default SourceControl;