import { IconButton, Tooltip } from '@material-ui/core';
import { Cancel } from '@material-ui/icons';
import React from 'react';
import { checkUnmergedBranch, mergeInProgress } from '../../containers/git';
import { isDefined } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { Branch, isMergingBranch } from '../../store/slices/branches';
import { Metafile } from '../../store/slices/metafiles';
import { updateBranch } from '../../store/thunks/branches';
import { updateConflicted } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { Mode, useIconButtonStyle } from './useStyledIconButton';

export const isAbortable = (branch: Branch | undefined, metafile: Metafile | undefined) =>
    isDefined(branch) && isMergingBranch(branch) &&
    isDefined(metafile) && metafile.handler === 'Explorer';

type AbortButtonProps = {
    cardId: UUID,
    enabled?: boolean,
    mode?: Mode
};

/**
 * Button for aborting an in-progress merge that has halted due to conflicts.
 * 
 * @param props - Prop object for a card with unmerged changes.
 * @param props.cardId - Card UUID that should be tracked by this button.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const AbortButton = ({ cardId, enabled = true, mode = 'light' }: AbortButtonProps) => {
    const card = useAppSelector(state => cardSelectors.selectById(state, cardId));
    const metafile = useAppSelector(state => metafileSelectors.selectById(state, card?.metafile ? card.metafile : ''));
    const branch = useAppSelector(state => branchSelectors.selectById(state, metafile?.branch ?? ''));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const abort = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        if (isDefined(branch)) {
            const conflicted = await checkUnmergedBranch(branch.root, branch.ref);
            await mergeInProgress({ dir: branch.root, action: 'abort' });
            await dispatch(updateConflicted(conflicted)); // update all conflicted Metafiles with new status
            await dispatch(updateBranch(branch)); // update the Branch status and merging fields
        }
    }

    return (enabled && isAbortable(branch, metafile)) ? (
        <Tooltip title='Abort Merge'>
            <IconButton
                className={classes.root}
                aria-label='abort'
                onClick={abort}
            >
                <Cancel />
            </IconButton>
        </Tooltip>
    ) : null;
}

export default AbortButton;