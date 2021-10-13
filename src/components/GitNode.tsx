import React, { useState } from 'react';
import { Handle, NodeProps, Position } from 'react-flow-renderer';
import { ColorSet } from '../containers/colors';
import { removeUndefinedProperties } from '../containers/format';
import { OutlinedCard } from './GitGraphTag';

const customNodeStyles = (color: ColorSet, border: string, opacity?: string) => removeUndefinedProperties({
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
  const [isHovering, setIsHovering] = useState(false);

  return (
    <>
      {props.data.branch ? <OutlinedCard content={props.data.branch} placement='right' /> : null}
      {isHovering ? <OutlinedCard content={props.id} placement='bottom' /> : null}
      <div style={customNodeStyles(props.data.color, props.data.border, props.data.opacity)}
        onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}
      >
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