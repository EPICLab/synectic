import { IconButton, Tooltip } from '@material-ui/core';
import { Cancel } from '@material-ui/icons';
import React from 'react';
import { checkUnmergedBranch, getBranchRoot, mergeInProgress } from '../../containers/git';
import { isDefined } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { isMergingMetafile, Metafile } from '../../store/slices/metafiles';
import { RootState } from '../../store/store';
import { updateConflicted } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { Mode, useIconButtonStyle } from './useStyledIconButton';

export const isAbortable = (metafile: Metafile | undefined) => isDefined(metafile) && isMergingMetafile(metafile);

/**
 * Button for aborting an in-progress merge that has halted due to conflicts.
 * 
 * @param props - Prop object for a card with unmerged changes.
 * @param props.cardId - Card UUID that should be tracked by this button.
 * @param props.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const AbortButton = ({ cardId, mode = 'light' }: { cardId: UUID, mode?: Mode }) => {
    const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, cardId));
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, card?.metafile ? card.metafile : ''));
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile?.repo ? metafile.repo : ''));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const abort = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        if (repo && metafile?.merging?.base) {
            const branchRoot = await getBranchRoot(repo.root, metafile.merging.base);
            if (branchRoot) {
                const conflicted = await checkUnmergedBranch(branchRoot, metafile.merging.base);
                await mergeInProgress({ dir: branchRoot, action: 'abort' });
                await dispatch(updateConflicted(conflicted));
            }
        }
    }

    return (
        <>
            {isAbortable(metafile) && <Tooltip title='Abort Merge'>
                <IconButton
                    className={classes.root}
                    aria-label='abort'
                    onClick={abort}
                >
                    <Cancel />
                </IconButton>
            </Tooltip>}
        </>
    );
}

export default AbortButton;