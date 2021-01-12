import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { Theme, Tooltip, withStyles } from '@material-ui/core';

const customNodeStyles = {
  height: 10,
  width: 10,
  borderRadius: '50%',
  background: '#9CABB3',
  color: '#FFF',
  padding: 10,
};

const LightTooltip = withStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontFamily: 'Lato, Georgia, Serif',
    fontSize: 11,
  },
}))(Tooltip);

export const GitNode: React.FunctionComponent<{ data: { text: string, tooltip: string } }> = ({ data }) => {
  return (
    <LightTooltip title={data.tooltip} placement='right'>
      <div style={customNodeStyles}>
        <Handle type='target' position={Position.Top} style={{ borderRadius: '50%' }} />
        <div>{data.text}</div>
        <Handle type='source' position={Position.Bottom} style={{ borderRadius: '50%' }} />
      </div>
    </LightTooltip>
  )
}

export const nodeTypes = {
  gitNode: GitNode
}