import { TreeView } from '@material-ui/lab';
import React from 'react';
import { v4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { cardUpdated } from '../../store/slices/cards';
import { modalAdded } from '../../store/slices/modals';
import { switchBranch } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import BranchItem from './BranchItem';

/**
 * React Component to display a list of branches from the repository associated with a particular card. The list
 * includes both local and remote branches, and allows for checking out any branch at any point (without concern 
 * for whether there are changes on a particular branch). Checkouts will only affect the contents of the indicated 
 * card.
 * 
 * @param props Prop object for branches on a specific repository.
 * @param props.cardId - The UUID for the parent Card component displaying this component.
 * @param props.repoId - The UUID of the repository used to find and display branches.
 * @returns {React.Component} A React function component.
 */
const BranchList = ({ cardId, repoId }: { cardId: UUID, repoId: UUID }) => {
    const card = useAppSelector(state => cardSelectors.selectById(state, cardId));
    const metafile = useAppSelector(state => metafileSelectors.selectById(state, card?.metafile ?? ''));
    const repo = useAppSelector(state => repoSelectors.selectById(state, repoId));
    const repoBranches = useAppSelector(state => branchSelectors.selectByRepo(state, repo, true));
    const branches = repoBranches.filter(branch => branch.ref !== 'HEAD').sort((a, b) => a.ref.localeCompare(b.ref));
    const dispatch = useAppDispatch();

    const checkout = async (branchId: UUID, branchRef: string) => {
        if (metafile?.branch === branchId) {
            dispatch(modalAdded({
                id: v4(), type: 'Notification',
                options: { 'message': `Card already set to branch '${branchRef}'` }
            }));
        }
        console.log(`checkout: ${branchRef}`);
        if (card && metafile && repo) {
            try {
                const updated = await dispatch(switchBranch({ metafileId: metafile.id, ref: branchRef, root: repo.root })).unwrap();
                if (updated) dispatch(cardUpdated({
                    ...card,
                    name: updated.name,
                    modified: updated.modified,
                    metafile: updated.id
                }));
            } catch (error) {
                console.error(`Checkout failed: `, error);
            }
        }
    };

    return (
        <div className='list-component'>
            <TreeView expanded={repo ? [repo.id] : []}>
                {branches.map(branch =>
                    <BranchItem
                        key={branch.id}
                        repoId={repoId}
                        branchId={branch.id}
                        highlight={metafile?.branch === branch.id}
                        onClickHandler={() => checkout(branch.id, branch.ref)}
                    />
                )}
            </TreeView>
        </div>
    );
}

export default BranchList;