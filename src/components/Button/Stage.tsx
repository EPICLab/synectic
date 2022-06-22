import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { add } from '../../containers/git-plumbing';
import { isFileMetafile, Metafile } from '../../store/slices/metafiles';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { cardUpdated } from '../../store/slices/cards';
import { addItemInArray, removeItemInArray } from '../../store/immutables';
import { UUID } from '../../store/types';
import { updatedVersionedMetafile } from '../../store/thunks/metafiles';

/**
 * Button for managing the staging of changes for VCS-tracked cards. This button tracks the status of metafiles associated with the list
 * of cards supplied via props. The button is only enabled when at least one associated metafile has a VCS status of `*absent`, `*added`,
 * `*undeleted`, `*modified`, or `*deleted`. Clicking on the button will trigger all unstaged metafiles to have their changes staged.
 * @param cardIds List of Card UUIDs that should be tracked by this button.
 * @param mode Optional mode for switching between light and dark themes.
 */
const StageButton = ({ cardIds, mode = 'light' }: { cardIds: UUID[], mode?: Mode }) => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const unstaged = metafiles
        .filter(m => m.status ? ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(m.status) : false);
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const isExplorer = metafiles.find(m => m.handler === 'Explorer') ? true : false;
    const hasUnstaged = unstaged.length > 0;
    const hasConflicts = unstaged.find(m => m.conflicts && m.conflicts.length > 0) ? true : false;
    const isCaptured = cards[0]?.captured !== undefined;

    const stage = async () => await Promise.all(unstaged
        .filter(isFileMetafile)
        .map(async metafile => {
            await add(metafile.path);
            console.log(`staging ${metafile.name}`);
            dispatch(updatedVersionedMetafile(metafile));
        })
    );

    const onHover = (target: Metafile[]) => {
        if (cards.length > 1) {
            cards.filter(c => target.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected-card') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected-card') })));
    }

    return (
        <>
            {!isExplorer && hasUnstaged && !hasConflicts && !isCaptured &&
                <Tooltip title='Stage'>
                    <IconButton
                        className={classes.root}
                        aria-label='stage'
                        onClick={stage}
                        onMouseEnter={() => onHover(unstaged)}
                        onMouseLeave={offHover}
                    >
                        <Add />
                    </IconButton>
                </Tooltip>}
        </>
    );
}

export default StageButton;