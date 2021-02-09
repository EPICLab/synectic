import React from 'react';
import { Handle, NodeProps, Position } from 'react-flow-renderer';
import { Theme, Tooltip, withStyles } from '@material-ui/core';
import { ColorSet } from '../containers/colors';

const customNodeStyles = (color: ColorSet, border: string, opacity?: string) => ({
  borderRadius: '50%',
  borderStyle: border,
  borderWidth: 'thin',
  opacity: opacity,
  background: color.primary,
  color: color.secondary,
  padding: 5,
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

type GitNodeProps = NodeProps & {
  data: {
    text: string,
    tooltip: string,
    color: ColorSet,
    border: string,
    opacity?: string,
    branch?: string
  }
}

export const GitNode: React.FunctionComponent<GitNodeProps> = props => {
  return (
    props.data.branch ?
      <LightTooltip title={props.data.branch} placement='right' open={true} arrow={true} >
        <div style={customNodeStyles(props.data.color, props.data.border, props.data.opacity)}>
          <Handle type='target' position={Position.Top} style={{ visibility: 'hidden' }} />
          <div>{props.data.text}</div>
          <Handle type='source' position={Position.Bottom} style={{ visibility: 'hidden' }} />
        </div>
      </LightTooltip>
      :
      <div style={customNodeStyles(props.data.color, props.data.border, props.data.opacity)}>
        <Handle type='target' position={Position.Top} style={{ visibility: 'hidden' }} />
        <div>{props.data.text}</div>
        <Handle type='source' position={Position.Bottom} style={{ visibility: 'hidden' }} />
      </div>
  )
}

export const nodeTypes = {
  gitNode: GitNode
}