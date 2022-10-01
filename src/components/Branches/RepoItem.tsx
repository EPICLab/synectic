import React from 'react';
import { Refresh } from '@material-ui/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
import { RootState } from '../../store/store';
import { StyledTreeItem } from '../StyledTreeComponent';
import BranchItem from './BranchItem';
import NewBranchItem from './NewBranchItem';
import { updateBranches } from '../../store/thunks/branches';

const RepoItem = (props: { repoId: string }) => {
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repoId));
    const branches = useAppSelector((state: RootState) => branchSelectors.selectByRepo(state, repo, true));
    const sortedBranches = branches.filter(branch => branch.ref !== 'HEAD').sort((a, b) => a.ref.localeCompare(b.ref));
    const dispatch = useAppDispatch();

    const handleLabelInfoClick = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
        if (repo) dispatch(updateBranches(repo));
    };

    return (
        <StyledTreeItem
            key={props.repoId}
            nodeId={props.repoId}
            labelText={repo ? repo.name : ''}
            labelInfo={Refresh}
            labelInfoClickHandler={handleLabelInfoClick}
            enableHover={true}
        >
            {sortedBranches.map(branch =>
                <BranchItem key={branch.id} repoId={props.repoId} branchId={branch.id} />
            )}
            <NewBranchItem repoId={props.repoId} />
        </StyledTreeItem>
    );
}

export default RepoItem;