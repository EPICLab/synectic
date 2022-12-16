import React from 'react';
import { Paper } from '@material-ui/core';
import { Alert, Color } from '@material-ui/lab';
import { MergeOutput } from '../../containers/git';
import { LinearProgressWithLabel } from '../Status';
import { isDefined } from '../../containers/utils';

const StatusBar = ({ severity, message }: { severity: Color, message: string | undefined }) => {
    return (
        <Paper>
            <Alert severity={severity}>
                {message}
            </Alert>
        </Paper>
    );
}

const MergeStatus = ({ result }: { result: MergeOutput | undefined }) => {
    if (!isDefined(result)) return null;
    switch (result.status) {
        case 'Passing':
            return <StatusBar severity='success' message={result.output} />;
        case 'Failing':
            return (result.conflicts && result.conflicts.length > 0) ?
                <StatusBar severity='warning' message={result.output} /> :
                <StatusBar severity='error' message={result.output} />;
        case 'Running':
            return <LinearProgressWithLabel value={0} subtext='Running merge...' />
        default:
            return null;
    }
};

export default MergeStatus;