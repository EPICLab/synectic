import { IconButton, Tooltip } from '@material-ui/core';
import { Undo } from '@material-ui/icons';
import { createHash } from 'crypto';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addItemInArray, removeItemInArray } from '../../store/immutables';
import cachedSelectors from '../../store/selectors/cache';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { cardUpdated } from '../../store/slices/cards';
import { isFileMetafile } from '../../store/slices/metafiles';
import { updateFilebasedMetafile, updateVersionedMetafile } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { Mode, useIconButtonStyle } from './useStyledIconButton';

/**
 * Button for undoing changes back to the most recent version according to the filesystem for file-based cards. This button tracks the 
 * state of metafiles associated with the list of cards supplied via props. The button is only enabled when at least one associated 
 * metafile has content that is diverged from the cache (according to FSCache). Clicking on the button will trigger all modified metafiles 
 * to have their content reset to the content in the associated files. This button operates as the inverse operation to the `SaveButton`.
 * 
 * @param props - Prop object for cards with changes that differ from the filesystem version.
 * @param props.cardIds - List of Card UUIDs that should be tracked by this button.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const UndoButton = ({ cardIds, enabled = true, mode = 'light' }: { cardIds: UUID[], enabled?: boolean, mode?: Mode }) => {
    const cards = useAppSelector(state => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector(state => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const cache = useAppSelector(state => cachedSelectors.selectEntities(state));
    const modified = metafiles.filter(m => isFileMetafile(m) && createHash('md5').update(m.content).digest('hex') !== cache[m.path.toString()]?.content);
    const dispatch = useAppDispatch();
    const classes = useIconButtonStyle({ mode: mode });

    const undo = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        await Promise.all(modified
            .filter(isFileMetafile)
            .map(async metafile => {
                await dispatch(updateFilebasedMetafile(metafile));
                await dispatch(updateVersionedMetafile(metafile));
            })
        );

        offHover();
    }

    // check whether button is on a single card and also captured
    const isCaptured = cards[0]?.captured !== undefined;
    // check whether button is on a content-based card that can be undone based on file-content
    const isUndoable = modified[0]?.filetype !== 'Directory' && modified[0]?.handler === 'Editor';

    const onHover = () => {
        if (cards.length > 1) {
            cards.filter(c => modified.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected-card') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected-card') })));
    }

    return (enabled && isUndoable && !isCaptured) ? (
        <Tooltip title='Undo'>
            <IconButton
                className={classes.root}
                aria-label='undo'
                onClick={undo}
                onMouseEnter={onHover}
                onMouseLeave={offHover}
            >
                <Undo />
            </IconButton>
        </Tooltip>
    ) : null;

}

export default UndoButton;