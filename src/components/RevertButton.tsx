import React from 'react';
import type { UUID } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import cardSelectors from '../store/selectors/cards';
import metafileSelectors from '../store/selectors/metafiles';
import { RootState } from '../store/store';
import { isFilebasedMetafile, revertStagedChanges } from '../store/thunks/metafiles';
import { Tooltip } from '@material-ui/core';
import { History } from '@material-ui/icons';
import { addItemInArray, removeItemInArray } from '../store/immutables';
import { cardUpdated } from '../store/slices/cards';
import { StyledIconButton } from './StyledIconButton';

const RevertButton: React.FunctionComponent<{ cardIds: UUID[] }> = props => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, props.cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const unstaged = metafiles
        .filter(m => m.status ? ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(m.status) : false);
    const staged = metafiles
        .filter(m => m.status ? ['added', 'modified', 'deleted'].includes(m.status) : false);
    const dispatch = useAppDispatch();

    const revert = async () => {
        // map each staged and unstaged change
        unstaged.filter(isFilebasedMetafile).map(async m => await dispatch(revertStagedChanges(m)));
        staged.filter(isFilebasedMetafile).map(async m => await dispatch(revertStagedChanges(m)));
    }

    const isCaptured = cards.length == 1 && cards[0].captured !== undefined;

    const onHover = () => {
        if (cards.length > 1) {
            cards.filter(c => unstaged.find(m => c.metafile === m.id) || staged.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected') })));
    }

    return (
        <>
            {(unstaged.length > 0 || staged.length > 0) && !isCaptured &&
                <Tooltip title='Revert'>
                    <StyledIconButton
                        aria-label='revert'
                        onClick={revert}
                        onMouseEnter={onHover}
                        onMouseLeave={offHover}
                    >
                        <History />
                    </StyledIconButton>
                </Tooltip>}
        </>
    )
}

export default RevertButton;