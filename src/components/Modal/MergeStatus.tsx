import { Alert, AlertColor, Paper } from '@mui/material';
import React from 'react';
import { isDefined } from '../../containers/utils';
import { MergeOutput } from '../../store/types';
import { LinearProgressWithLabel } from '../Status';

const StatusBar = ({
  severity,
  message
}: {
  severity: AlertColor;
  message: string | undefined;
}) => {
  return (
    <Paper>
      <Alert sx={{ backgroundColor: 'rgba(56, 54, 57, 0.95)' }} severity={severity}>
        {message}
      </Alert>
    </Paper>
  );
};

const MergeStatus = ({ result }: { result: MergeOutput | undefined }) => {
  if (!isDefined(result)) return null;
  switch (result.status) {
    case 'Passing':
      return <StatusBar severity="success" message={result.output} />;
    case 'Failing':
      return result.conflicts && result.conflicts.length > 0 ? (
        <StatusBar severity="warning" message={result.output} />
      ) : (
        <StatusBar severity="error" message={result.output} />
      );
    case 'Running':
      return <LinearProgressWithLabel value={0} subtext="Running merge..." />;
    default:
      return null;
  }
};

export default MergeStatus;
