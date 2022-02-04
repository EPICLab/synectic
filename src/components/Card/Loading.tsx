import React from 'react';
import { DateTime } from 'luxon';
import type { Card } from '../../types';
import DataField from '../Card/DataField';
import metafileSelectors from '../../store/selectors/metafiles';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import { CircularProgress, makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
    root: {
        background: 'transparent',
        minWidth: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: '0 0 10px 10px'
    },
    card: {
        margin: 'auto',
        maxWidth: '40%',
        minHeight: '20vh',
        display: 'flex',
        alignItems: 'center'
    }
});

const Loading: React.FunctionComponent = () => {
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <CircularProgress className={classes.card} size={60} color='secondary' />
        </div>);
}

export const LoadingReverse: React.FunctionComponent<Card> = props => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));

    return (
        <>
            <div className='buttons'>
            </div>
            <DataField title='UUID' textField field={props.id} />
            <DataField title='Path' textField field={metafile?.path?.toString()} />
            <DataField title='Update' textField field={DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)} />
        </>
    );
};

export default Loading;