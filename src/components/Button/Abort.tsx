import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { ClearAll } from '@material-ui/icons';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { abortMerge, checkProject } from '../../containers/merges';
import { isConflictManagerMetafile } from '../ConflictManager/ConflictManager';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { cardRemoved } from '../../store/slices/cards';
import { UUID } from '../../store/types';
import { getBranchRoot } from '../../containers/git-path';
import { updateConflicted } from '../../store/thunks/metafiles';

const AbortButton = ({ cardId, mode = 'light' }: { cardId: UUID, mode?: Mode }) => {
    const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, cardId));
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, card?.metafile ? card.metafile : ''));
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile?.repo ? metafile.repo : ''));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const isAbortable = metafile && isConflictManagerMetafile(metafile) && repo;

    const abort = async () => {
        if (repo && metafile?.merging?.base) {
            const branchRoot = await getBranchRoot(repo.root, metafile.merging.base);
            if (branchRoot) {
                const conflicted = await checkProject(branchRoot, metafile.merging.base);
                await abortMerge(branchRoot);
                await dispatch(updateConflicted(conflicted));
            }
        }
        dispatch(cardRemoved(cardId));
    }

    return (
        <>
            {isAbortable && <Tooltip title='Abort Merge'>
                <IconButton
                    className={classes.root}
                    aria-label='abort'
                    onClick={abort}
                >
                    <ClearAll />
                </IconButton>
            </Tooltip>}
        </>
    );
}

export default AbortButton;