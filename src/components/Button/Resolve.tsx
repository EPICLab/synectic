import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { CheckCircle } from '@material-ui/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import { UUID } from '../../store/types';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import branchSelectors from '../../store/selectors/branches';
import metafileSelectors from '../../store/selectors/metafiles';
import { isDefined } from '../../containers/utils';
import { Branch, isMergingBranch } from '../../store/slices/branches';
import { isFilebasedMetafile, Metafile, VersionedMetafile } from '../../store/slices/metafiles';
import { commit, fetchMergingBranches } from '../../containers/git';
import { updateBranch } from '../../store/thunks/branches';
import { updateFilebasedMetafile, updateVersionedMetafile } from '../../store/thunks/metafiles';

const isResolvable = (branch: Branch | undefined, metafile: Metafile | undefined, conflicted: VersionedMetafile[]) =>
    isDefined(branch) && isMergingBranch(branch) && conflicted.length === 0 &&
    isDefined(metafile) && metafile.handler === 'Explorer';

/**
 * Button for committing and resolving an in-progress merge that has halted due ot conflicts.
 * 
 * @param props - Prop object for card with unmerged changes.
 * @param props.cardId - Card UUID that should be tracked by this button.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const ResolveButton = ({ cardId, enabled = true, mode = 'light' }: { cardId: UUID, enabled?: boolean, mode?: Mode }) => {
    const card = useAppSelector(state => cardSelectors.selectById(state, cardId));
    const metafile = useAppSelector(state => metafileSelectors.selectById(state, card?.metafile ?? ''));
    const branch = useAppSelector(state => branchSelectors.selectById(state, metafile?.branch ?? ''));
    const conflicted = useAppSelector(state => metafileSelectors.selectByConflicted(state, metafile?.repo ?? '', branch?.id));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const resolve = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        if (isDefined(metafile) && isFilebasedMetafile(metafile) && isDefined(branch)) {
            const mergingBranches = await fetchMergingBranches(branch.root);
            const result = await commit({ dir: branch.root, message: `Merge branch '${mergingBranches.compare}' into ${branch.ref}` });
            console.log(`commit result: ${result}`);
            await dispatch(updateFilebasedMetafile(metafile));
            await dispatch(updateVersionedMetafile(metafile));
            await dispatch(updateBranch(branch));
        } else {
            console.log(`Unresolveable...`);
        }
    }

    return (enabled && isResolvable(branch, metafile, conflicted)) ?
        <Tooltip title='Resolve Merge'>
            <IconButton
                className={classes.root}
                aria-label='resolve'
                onClick={resolve}
            >
                <CheckCircle />
            </IconButton>
        </Tooltip> : null;
};

export default ResolveButton;