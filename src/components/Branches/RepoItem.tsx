import React from 'react';
import { Refresh } from '@material-ui/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
import { StyledTreeItem } from '../StyledTreeComponent';
import BranchItem from './BranchItem';
import NewBranchItem from './NewBranchItem';
import { addBranch, updateBranches } from '../../store/thunks/branches';
import { Branch } from '../../store/slices/branches';
import { buildCard } from '../../store/thunks/cards';
import { fetchMetafile } from '../../store/thunks/metafiles';

const RepoItem = (props: { repoId: string }) => {
    const repo = useAppSelector(state => repoSelectors.selectById(state, props.repoId));
    const branches = useAppSelector(state => branchSelectors.selectByRepo(state, repo?.id ?? '', true));
    const sortedBranches = branches.filter(branch => branch.ref !== 'HEAD').sort((a, b) => a.ref.localeCompare(b.ref));
    const dispatch = useAppDispatch();

    const handleLabelInfoClick = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
        if (repo) await dispatch(updateBranches(repo));
    };

    const handleItemClick = async (branch: Branch) => {
        if (branch && repo) {
            const updatedBranch = await dispatch(addBranch({ ref: branch.ref, root: repo.root })).unwrap();
            if (updatedBranch) dispatch(updateBranches(repo));
            const metafile = updatedBranch
                ? await dispatch(fetchMetafile({ path: updatedBranch.root, handlers: ['Explorer', 'Editor'] })).unwrap()
                : undefined;
            if (metafile) dispatch(buildCard({ metafile: metafile }));
        }
    }

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
                <BranchItem
                    key={branch.id}
                    repoId={props.repoId}
                    branchId={branch.id}
                    deletable={true}
                    onClickHandler={() => handleItemClick(branch)}
                />
            )}
            <NewBranchItem repoId={props.repoId} />
        </StyledTreeItem>
    );
}

export default RepoItem;