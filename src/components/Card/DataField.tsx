import React from 'react';
import { Typography } from '@material-ui/core';

const DataField: React.FunctionComponent<{ title: string, field: React.ReactNode, textField?: boolean }> = props => {
    return (
        <>
            <div className='title'><Typography variant='body2'>{props.title}:</Typography></div>
            {props.textField ?
                <div className='field'><Typography variant='body2'>{props.field}</Typography></div> :
                <div className='field'>{props.field}</div>
            }
        </>
    );
}

export default DataField;