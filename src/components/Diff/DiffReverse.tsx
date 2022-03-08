import React from 'react';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import cardSelectors from '../../store/selectors/cards';
import DataField from '../Card/DataField';
import { Card } from '../../store/slices/cards';

const DiffReverse = (props: Card) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
    const original = useAppSelector((state: RootState) => cardSelectors.selectById(state, metafile?.targets?.[0] ? metafile.targets[0] : ''));
    const updated = useAppSelector((state: RootState) => cardSelectors.selectById(state, metafile?.targets?.[1] ? metafile.targets[1] : ''));

    return (
        <>
            <div className='buttons'>
            </div>
            <DataField title='Left' textField field={`${original ? original.name : '[Cannot locate original card]'} (...${original ? original.id.slice(-5) : '[uuid]'})`} />
            <DataField title='Right' textField field={`${updated ? updated.name : '[Cannot locate updated card'} (...${updated ? updated.id.slice(-5) : '[uuid]'})`} />
        </>
    );
};

export default DiffReverse;
