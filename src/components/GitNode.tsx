import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { Theme, Tooltip, withStyles } from '@material-ui/core';
import { ColorSet } from '../containers/colors';

const customNodeStyles = (color: ColorSet) => ({
  borderRadius: '50%',
  background: color.primary,
  color: color.secondary,
  padding: 10,
});

const LightTooltip = withStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontFamily: 'Lato, Georgia, Serif',
    fontSize: 11,
  },
}))(Tooltip);

export const GitNode: React.FunctionComponent<{ data: { text: string, tooltip: string, color: ColorSet } }> = ({ data }) => {
  return (
    <LightTooltip title={data.tooltip} placement='right'>
      <div style={customNodeStyles(data.color)}>
        <Handle type='target' position={Position.Top} style={{ visibility: 'hidden' }} />
        <div>{data.text}</div>
        <Handle type='source' position={Position.Bottom} style={{ visibility: 'hidden' }} />
      </div>
    </LightTooltip>
  )
}

export const nodeTypes = {
  gitNode: GitNode
}