import React from 'react';
import { Handle, NodeProps, Position } from 'react-flow-renderer';
import { ColorSet } from '../containers/colors';
import { OutlinedCard } from './GitGraphBranchTag';

const customNodeStyles = (color: ColorSet, border: string, opacity?: string) => ({
  borderRadius: '50%',
  borderStyle: border,
  borderWidth: 'thin',
  opacity: opacity,
  background: color.primary,
  color: color.secondary,
  padding: 5,
});

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
    <>
      { props.data.branch ? <OutlinedCard content={props.data.branch} placement='right' /> : null}
      <div style={customNodeStyles(props.data.color, props.data.border, props.data.opacity)}>
        <Handle type='target' position={Position.Top} style={{ visibility: 'hidden' }} />
        <div>{props.data.text}</div>
        <Handle type='source' position={Position.Bottom} style={{ visibility: 'hidden' }} />
      </div>
    </>
  )
}

export const nodeTypes = {
  gitNode: GitNode
}