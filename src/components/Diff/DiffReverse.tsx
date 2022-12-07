import React, { useState } from 'react';
import { isDefined } from '../../containers/utils';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { Card } from '../../store/slices/cards';
import { RootState } from '../../store/store';
import MetadataViewButton from '../Button/MetadataView';
import RefreshButton from '../Button/Refresh';
import Metadata from '../Card/Metadata';

const DiffReverse = (props: Card) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
    const [view, setView] = useState('metadata');

    return (
        <>
            <div className='buttons'>
                <MetadataViewButton onClickHandler={() => setView('metadata')} enabled={isDefined(metafile)} mode='dark' />
                {isDefined(metafile) ? <RefreshButton metafileIds={[metafile.id]} mode='dark' /> : undefined}
            </div>
            <div className='area'>
                {view === 'metadata' && isDefined(metafile) ? <Metadata metafile={metafile} /> : undefined}
            </div>
        </>
    );
};

export default DiffReverse;
