import React from 'react';
import { makeStyles, Theme, withStyles } from '@material-ui/core/styles';
import { Card, Typography } from '@material-ui/core';

type Placement =
  'top-start' | 'top' | 'top-end' | 'left-start' | 'left' | 'left-end' |
  'right-start' | 'right' | 'right-end' | 'bottom-start' | 'bottom' | 'bottom-end'

// Mapped object type for converting Placement into `top` and `left` position presets
type PlacementPosition = {
  [key in Placement]: { top: number; left: number; };
};

const placementToPosition: PlacementPosition = {
  'top-start': { top: -15, left: -5 },
  'top': { top: -15, left: 0 },
  'top-end': { top: -15, left: 5 },
  'left-start': { top: -5, left: -15 },
  'left': { top: 0, left: -15 },
  'left-end': { top: 5, left: -15 },
  'right-start': { top: -5, left: 15 },
  'right': { top: 0, left: 15 },
  'right-end': { top: 5, left: 15 },
  'bottom-start': { top: 15, left: -5 },
  'bottom': { top: 15, left: 0 },
  'bottom-end': { top: 15, left: 5 }
};

const StyledTag = withStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.palette.common.white,
    height: 'max-content',
    width: 'max-content',
    boxShadow: theme.shadows[1],
    borderRadius: '2px',
    border: '0px',
    padding: '1px 2px'
  }
}))(Card);

const useStyles = makeStyles({
  content: {
    fontSize: 6,
    fontFamily: 'Lato, Georgia, Serif',
    color: 'rgba(0, 0, 0, 0.87)',
  },
});

export const OutlinedCard: React.FunctionComponent<{ content: string, placement: Placement }> = props => {
  const classes = useStyles();
  const position = placementToPosition[props.placement];

  return (
    <StyledTag style={{ position: 'absolute', top: position.top, left: position.left }}>
      <Typography className={classes.content}>
        {props.content}
      </Typography>
    </StyledTag>
  );
}