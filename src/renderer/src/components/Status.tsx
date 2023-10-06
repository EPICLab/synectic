import { Check, Clear } from '@mui/icons-material';
import { Box, CircularProgress, LinearProgress, Typography, styled } from '@mui/material';
import { green, red } from '@mui/material/colors';
import type { Status } from 'types/app';

const StatusIcon = (props: { status: Status; progress?: number }) => {
  switch (props.status) {
    case 'Running':
      return props.progress ? (
        <StyledCircularProgress size={18} variant="determinate" value={props.progress} />
      ) : (
        <StyledCircularProgress size={18} />
      );
    case 'Passing':
      return <StyledCheckIcon />;
    case 'Failing':
      return <StyledClearIcon />;
    default:
      return null;
  }
};

export const LinearProgressWithLabel = (props: { value: number; subtext?: string }) => {
  return (
    <>
      <Box display="flex" alignItems="center" ml={2} mr={1}>
        <Box width="100%" mr={1}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box minWidth={35}>
          <Typography variant="body2" color="textSecondary">{`${Math.round(
            props.value
          )}%`}</Typography>
        </Box>
      </Box>
      {props.subtext ? (
        <Box width="100%" ml={2} mr={1}>
          <Typography variant="caption" color="textSecondary">
            {props.subtext}
          </Typography>
        </Box>
      ) : undefined}
    </>
  );
};

const StyledCheckIcon = styled(Check)(() => ({
  height: 22,
  width: 22,
  margin: 4,
  padding: 0,
  verticalAlign: 'middle',
  color: green[500]
}));

const StyledClearIcon = styled(Clear)(() => ({
  height: 22,
  width: 22,
  padding: 0,
  margin: 4,
  verticalAlign: 'middle',
  color: red[500]
}));

const StyledCircularProgress = styled(CircularProgress)(() => ({
  margin: 4,
  padding: 2,
  verticalAlign: 'middle'
}));

export default StatusIcon;
