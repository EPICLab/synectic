import React from 'react';
import type { UUID } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { RootState } from '../../store/store';
import { isFilebasedMetafile, revertStagedChanges } from '../../store/thunks/metafiles';
import { IconButton, Tooltip } from '@material-ui/core';
import { SettingsBackupRestore } from '@material-ui/icons';
import { addItemInArray, removeItemInArray } from '../../store/immutables';
import { cardUpdated } from '../../store/slices/cards';
import { Mode, useIconButtonStyle } from './useStyledIconButton';

type ResetButtonProps = {
    cardIds: UUID[],
    mode?: Mode
}

/**
 * Button for resetting changes back to the most recent version according to the version control system for VCS-tracked cards. This button 
 * tracks the status of metafiles associated with the list of cards supplied via props. The button is only enabled when at least one 
 * associated metafile has a VCS status of `added`, `*added`, `modified`, `*modified`, `deleted`, `*deleted`, `*modified`, or `*undeleted`.
 * Clicking on the button will trigger all changed metafiles to have their content reverted back to the most recent commit in the associated 
 * repository and branch.
 * @param cardIds List of Card UUIDs that should be tracked by this button.
 * @param mode Optional theme mode for switching between light and dark themes.
 * @returns 
 */
const ResetButton: React.FunctionComponent<ResetButtonProps> = ({ mode = 'light', cardIds }) => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const unstaged = metafiles
        .filter(m => m.status ? ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(m.status) : false);
    const staged = metafiles
        .filter(m => m.status ? ['added', 'modified', 'deleted'].includes(m.status) : false);
    const dispatch = useAppDispatch();
    const classes = useIconButtonStyle({ mode: mode });

    const revert = async () => {
        // map each staged and unstaged change
        await Promise.all(unstaged.filter(isFilebasedMetafile).map(async m => await dispatch(revertStagedChanges(m))));
        await Promise.all(staged.filter(isFilebasedMetafile).map(async m => await dispatch(revertStagedChanges(m))));
    }

    const isExplorer = metafiles.find(m => m.handler === 'Explorer');
    const hasChanges = (unstaged.length > 0 || staged.length > 0);
    const isCaptured = cards.length == 1 && cards[0].captured !== undefined;

    const onHover = () => {
        if (cards.length > 1) {
            cards.filter(c => unstaged.find(m => c.metafile === m.id) || staged.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected-card') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected-card') })));
    }

    return (
        <>
            {!isExplorer && hasChanges && !isCaptured &&
                <Tooltip title='Reset'>
                    <IconButton
                        className={classes.root}
                        aria-label='reset'
                        onClick={revert}
                        onMouseEnter={onHover}
                        onMouseLeave={offHover}
                    >
                        <SettingsBackupRestore />
                    </IconButton>
                </Tooltip>}
        </>
    )
}

export default ResetButton;