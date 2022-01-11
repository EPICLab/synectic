import React from 'react';
import { Tooltip, Typography } from '@material-ui/core';

const DataField: React.FunctionComponent<{ title: string, field: React.ReactNode, textField?: boolean }> = props => {
    return (
        <>
            <div className='title'><Typography variant='body2'>{props.title}:</Typography></div>
            {props.textField && props.field ?
                <div className='field'><Tooltip title={props.field}><Typography variant='body2'>{props.field}</Typography></Tooltip></div> :
                <div className='field'>{props.field}</div>
            }
        </>
    );
}

export default DataField;