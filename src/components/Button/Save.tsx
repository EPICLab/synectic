import React from 'react';
import { Save } from '@material-ui/icons';
import { fileSaveDialog } from '../../containers/dialogs';
import { writeFileAsync } from '../../containers/io';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addItemInArray, removeItemInArray } from '../../store/immutables';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { cardUpdated } from '../../store/slices/cards';
import { isFileMetafile, isVirtualMetafile, metafileUpdated } from '../../store/slices/metafiles';
import { RootState } from '../../store/store';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { IconButton, Tooltip } from '@material-ui/core';
import { UUID } from '../../store/types';
import { updatedVersionedMetafile } from '../../store/thunks/metafiles';
import cachedSelectors from '../../store/selectors/cache';

/**
 * Button for saving the content of modified metafiles to their associated files. This button tracks the state of metafiles associated
 * with the list of cards supplied via props. The button is only enabled when at least one associated metafile has content that is
 * diverged from the cache (according to FSCache). Clicking on the button will trigger all modified metafiles to write their content
 * to the associates files. This button operates as the inverse operation to the `UndoButton`.
 * @param cardIds List of Card UUIDs that should be tracked by this button.
 * @param mode Optional theme mode for switching between light and dark themes.
 * @returns 
 */
const SaveButton = ({ cardIds, mode = 'light' }: { cardIds: UUID[], mode?: Mode }) => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const cache = useAppSelector((state: RootState) => cachedSelectors.selectEntities(state));
    const modified = metafiles.filter(m => (isFileMetafile(m) && m.content !== cache[m.path.toString()]?.content) || (isVirtualMetafile(m) && m.content && m.content.length > 0));
    const dispatch = useAppDispatch();
    const classes = useIconButtonStyle({ mode: mode });

    const save = async () => {
        await Promise.all(modified
            .filter(isFileMetafile)
            .map(async metafile => {
                await writeFileAsync(metafile.path, metafile.content);
                const updated = await dispatch(updatedVersionedMetafile(metafile)).unwrap();
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
    const isCaptured = cards.length == 1 && cards[0].captured !== undefined;
    // check whether button is on a content-based card that can be saved to a file
    const isSaveable = modified.length > 0 && modified[0].filetype !== 'Directory' && modified[0].handler === 'Editor';

    const onHover = () => {
        if (cards.length > 1) {
            cards.filter(c => modified.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected-card') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected-card') })));
    }

    return (
        <>
            {isSaveable && !isCaptured &&
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
                </Tooltip>}
        </>
    );
}

export default SaveButton;