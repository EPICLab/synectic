import React, { useState } from 'react';
import { isDefined } from '../../containers/utils';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { Card } from '../../store/slices/cards';
import MetadataViewButton from '../Button/MetadataView';
import Metadata from '../Card/Metadata';


const SourceControlReverse = (props: Card) => {
    const metafile = useAppSelector(state => metafileSelectors.selectById(state, props.metafile));
    const [view, setView] = useState('metadata');

    return (
        <>
            <div className='buttons'>
                <MetadataViewButton onClickHandler={() => setView('metadata')} enabled={isDefined(metafile)} mode='dark' />
            </div>
            <div className='area'>
                {view === 'metadata' && isDefined(metafile) ? <Metadata metafile={metafile} /> : undefined}
            </div>
        </>
    );
};

export default SourceControlReverse;