import React from 'react';
import { TreeView } from '@material-ui/lab';
import { RootState } from '../../store/store';
import BranchRibbon from '../BranchRibbon';
import { StyledTreeItem } from '../StyledTreeComponent';
import { GitBranchIcon } from '../GitIcons';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import SourceFileComponent from './SourceFileComponent';
import branchSelectors from '../../store/selectors/branches';
import { UUID } from '../../store/types';
import { isFileMetafile } from '../../store/slices/metafiles';

const SourceControl = (props: { sourceControlId: UUID }) => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.sourceControlId));
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile && metafile.repo ? metafile.repo : ''));
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));
  const staged = useAppSelector((state: RootState) => metafileSelectors.selectStagedByBranch(state, branch ? branch.id : ''));
  const unstaged = useAppSelector((state: RootState) => metafileSelectors.selectUnstagedByBranch(state, branch ? branch.id : ''));

  return (
    <>
      {branch ?
        <div className='list-component'>
          <BranchRibbon metafile={metafile} onClick={() => { console.log({ metafile, branch, staged, unstaged }) }} />
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

export default SourceControl;