import React from 'react';
import { v4 } from 'uuid';
import { RootState } from '../../store/store';
import { StyledTreeItem } from '../StyledTreeComponent';
import { GitRepoIcon } from '../GitIcons';
import { useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import { Repository } from '../../store/slices/repos';
import BranchStatus from '../BranchStatus';

const RepoStatus = (props: { repo: Repository; }) => {
    const branches = useAppSelector((state: RootState) => branchSelectors.selectByRepo(state, props.repo, true));

    return (
        <StyledTreeItem key={props.repo.id} nodeId={props.repo.id} labelText={props.repo.name} labelIcon={GitRepoIcon}>
            {branches.filter(branch => branch.ref !== 'HEAD').map(branch => <BranchStatus key={v4()} repo={props.repo} branch={branch} />)}
        </StyledTreeItem>
    );
};

export default RepoStatus;
