import React, { useContext } from 'react';
import { Undo } from '@material-ui/icons';
import type { UUID } from '../types';
import { fileSaveDialog } from '../containers/dialogs';
import { writeFileAsync } from '../containers/io';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addItemInArray, removeItemInArray } from '../store/immutables';
import cardSelectors from '../store/selectors/cards';
import metafileSelectors from '../store/selectors/metafiles';
import { cardUpdated } from '../store/slices/cards';
import { metafileUpdated } from '../store/slices/metafiles';
import { RootState } from '../store/store';
import { fetchVersionControl, isFileMetafile, isVirtualMetafile } from '../store/thunks/metafiles';
import { StyledIconButton } from './StyledIconButton';
import { FSCache } from './Cache/FSCache';
import { Tooltip } from '@material-ui/core';

const UndoButton: React.FunctionComponent<{ cardIds: UUID[] }> = props => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, props.cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const { cache } = useContext(FSCache);
    const modified = metafiles.filter(m => m.path && m.content !== cache.get(m.path));
    const dispatch = useAppDispatch();

    const undo = async () => {
        await Promise.all(modified
            .filter(isFileMetafile)
            .map(async metafile => {
                await writeFileAsync(metafile.path, metafile.content);
                const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
                dispatch(metafileUpdated({ ...metafile, ...vcs, state: 'unmodified' }));
            })
        );

        await Promise.all(modified
            .filter(isVirtualMetafile)
            .map(async metafile => {
                await dispatch(fileSaveDialog(metafile)); // will update metafile
            })
        );

        offHover();
    }

    const onHover = () => {
        if (cards.length > 1) {
            cards.filter(c => modified.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected') })));
    }

    return (
        <>
            {modified.length > 0 &&
                <Tooltip title='Undo'>
                    <StyledIconButton
                        aria-label='undo'
                        onClick={undo}
                        onMouseEnter={onHover}
                        onMouseLeave={offHover}
                    >
                        <Undo />
                    </StyledIconButton>
                </Tooltip>}
        </>
    );

}

export default UndoButton;