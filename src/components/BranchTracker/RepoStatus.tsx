import React from 'react';
import { v4 } from 'uuid';
import { Add } from '@material-ui/icons';
import { RootState } from '../../store/store';
import { StyledTreeItem } from '../StyledTreeComponent';
import { GitRepoIcon } from '../GitIcons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import { Repository } from '../../store/slices/repos';
import BranchStatus from './BranchStatus';
import { modalAdded } from '../../store/slices/modals';
import RepoItem from '../Branches/RepoItem'; // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * @deprecated This implementation has been updated with additional dynamic functionality, please use {@link RepoItem} instead.
 * @param props Prop object for branches on a specific repository.
 * @param props.repo The Repository object associated with the git branch.
 * @returns {React.Component} A React function component.
 */
const RepoStatus = (props: { repo: Repository; }) => {
    const branches = useAppSelector((state: RootState) => branchSelectors.selectByRepo(state, props.repo, true));
    const sortedBranches = branches.filter(branch => branch.ref !== 'HEAD').sort((a, b) => a.ref.localeCompare(b.ref));
    const dispatch = useAppDispatch();

    return (
        <StyledTreeItem key={props.repo.id} nodeId={props.repo.id} labelText={props.repo.name} labelIcon={GitRepoIcon}>
            {sortedBranches.map(branch =>
                <BranchStatus key={v4()} repo={props.repo} branch={branch} />
            )}
            <StyledTreeItem
                key={`${props.repo}-newBranch`}
                nodeId={`${props.repo}-newBranch`}
                labelText={`[new branch]`}
                labelIcon={Add}
                onClick={() => dispatch(modalAdded({ id: v4(), type: 'NewBranchDialog', target: props.repo.id }))} />
        </StyledTreeItem>
    );
};

export default RepoStatus;
