import React, { useContext } from 'react';
import { History } from '@material-ui/icons';
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
import { Button, Tooltip } from '@material-ui/core';

const RevertButton: React.FunctionComponent<{ cardIds: UUID[] }> = props => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, props.cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const { cache } = useContext(FSCache);
    const modified = metafiles.filter(m => m.path && m.content !== cache.get(m.path));
    const dispatch = useAppDispatch();

    const revert = async () => isFilebasedMetafile(props) ? await dispatch(revertStagedChanges(props)) : undefined;
    const isVirtual = isVirtualMetafile(props);
    const changes = props.path && props.status && ['*added', 'added', '*deleted', 'deleted', '*modified', 'modified'].includes(props.status) ? true : false;

    return (<Button onClick={revert} disabled={!changes}>Undo Changes</Button>)
}

export default RevertButton;