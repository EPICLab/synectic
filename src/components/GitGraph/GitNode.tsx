import React, { useState } from 'react';
import { clipboard } from 'electron';
import { Handle, NodeProps, Position } from 'react-flow-renderer';
import { v4 } from 'uuid';
import { ColorSet } from '../../containers/colors';
import { removeUndefinedProperties } from '../../containers/utils';
import { useAppDispatch } from '../../store/hooks';
import { modalAdded } from '../../store/slices/modals';
import OutlinedCard from './GitGraphTag';

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

const GitNode = (props: GitNodeProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const dispatch = useAppDispatch();

  const copyToClipboard = () => {
    clipboard.writeText(props.id);
    dispatch(modalAdded({
      id: v4(),
      type: 'Notification',
      options: {
        'message': `'${props.id.replace(props.id.slice(7, -7), '...')}' copied to clipboard`
      }
    }));
  }

  return (
    <>
      {props.data.branch ? <OutlinedCard content={props.data.branch} placement='right' /> : null}
      {isHovering ? <OutlinedCard content={props.id} placement='bottom' /> : null}
      <div style={customNodeStyles(props.data.color, props.data.border, props.data.opacity)}
        onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}
        onClick={copyToClipboard}
      >
        <Handle type='target' position={Position.Top} style={{ visibility: 'hidden' }} />
        <div style={{ background: 'red' }}>{props.data.text}</div>
        <Handle type='source' position={Position.Bottom} style={{ visibility: 'hidden' }} />
      </div>
    </>
  )
}

export const nodeTypes = {
  gitNode: GitNode
};

export default GitNode;