import React from 'react';
import { DateTime } from 'luxon';
import DataField from '../Card/DataField';
import { Card } from '../../store/slices/cards';

const BrowserReverse = (props: Card) => {
    return (
        <>
            <div className='buttons'>
            </div>
            <DataField title='Update' textField field={DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)} />
        </>
    );
};

export default BrowserReverse;