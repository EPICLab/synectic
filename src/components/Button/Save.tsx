import { IconButton, Tooltip } from '@material-ui/core';
import { Save } from '@material-ui/icons';
import { createHash } from 'crypto';
import React from 'react';
import { fileSaveDialog } from '../../containers/dialogs';
import { writeFileAsync } from '../../containers/io';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addItemInArray, removeItemInArray } from '../../store/immutables';
import cachedSelectors from '../../store/selectors/cache';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { cardUpdated } from '../../store/slices/cards';
import { isFileMetafile, isVirtualMetafile, metafileUpdated } from '../../store/slices/metafiles';
import { updateVersionedMetafile } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { Mode, useIconButtonStyle } from './useStyledIconButton';

/**
 * Button for saving the content of modified metafiles to their associated files. This button tracks the state of metafiles associated
 * with the list of cards supplied via props. The button is only enabled when at least one associated metafile has content that is
 * diverged from the cache or a virtual metafile with content (which by definition has not been written to a file yet). Clicking on the 
 * button will trigger all modified metafiles to write their content to the associates files. This button operates as the inverse 
 * operation to the `UndoButton`.
 * 
 * @param props - Prop object for cards associated with specific files.
 * @param props.cardIds - List of Card UUIDs that should be tracked by this button.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional theme mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const SaveButton = ({ cardIds, enabled = true, mode = 'light' }: { cardIds: UUID[], enabled?: boolean, mode?: Mode }) => {
    const classes = useIconButtonStyle({ mode: mode });
    const cards = useAppSelector(state => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector(state => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    // const selectByIds = useMemo(metafileSelectors.makeSelectByIds, []); // create a memoized selector for each component instance, on mount
    // const metafiles = useAppSelector(state => selectByIds(state, cards.map(c => c.metafile)));
    const cache = useAppSelector(state => cachedSelectors.selectEntities(state));
    const modified = metafiles.filter(m =>
        (isFileMetafile(m) && createHash('md5').update(m.content).digest('hex') !== cache[m.path.toString()]?.content) ||
        (isVirtualMetafile(m) && m.content && m.content.length > 0)
    );
    const dispatch = useAppDispatch();

    const save = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        await Promise.all(modified
            .filter(isFileMetafile)
            .map(async metafile => {
                await writeFileAsync(metafile.path, metafile.content);
                const updated = await dispatch(updateVersionedMetafile(metafile)).unwrap();
                dispatch(metafileUpdated({ ...updated, state: 'unmodified' }));
            })
        );

        await Promise.all(modified
            .filter(isVirtualMetafile)
            .map(async metafile => await dispatch(fileSaveDialog(metafile))) // will update metafile
        );

        offHover();
    }

    // check whether button is on a single card and also captured
    const isCaptured = cards[0]?.captured !== undefined;
    // check whether button is on a content-based card that can be saved to a file
    const isSaveable = modified[0]?.filetype !== 'Directory' && modified[0]?.handler === 'Editor';

    const onHover = () => {
        if (cards.length > 1) {
            cards.filter(c => modified.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected-card') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected-card') })));
    }

    return (enabled && isSaveable && !isCaptured) ? (
        <Tooltip title='Save'>
            <IconButton
                className={classes.root}
                aria-label='save'
                onClick={save}
                onMouseEnter={onHover}
                onMouseLeave={offHover}
            >
                <Save />
            </IconButton>
        </Tooltip>
    ) : null;
}

export default SaveButton;