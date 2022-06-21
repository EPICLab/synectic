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

const RepoStatus = (props: { repo: Repository; }) => {
    const branches = useAppSelector((state: RootState) => branchSelectors.selectByRepo(state, props.repo, true));
    const dispatch = useAppDispatch();

    return (
        <StyledTreeItem key={props.repo.id} nodeId={props.repo.id} labelText={props.repo.name} labelIcon={GitRepoIcon}>
            {branches.filter(branch => branch.ref !== 'HEAD').sort((a, b) => a.ref.localeCompare(b.ref)).map(branch =>
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
