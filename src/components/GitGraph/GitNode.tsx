import { styled } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import GraphTooltip from './GraphTooltip';
import { Color } from '../../store/types';
import { Prettify, isDefined } from '../../containers/utils';
import { CommitVertex } from '../../containers/hooks/useGitGraph';
import { useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import useToggle from '../../containers/hooks/useToggle';
import ContextMenu from './ContextMenu';

export type GitNodeProps = Prettify<NodeProps<CommitVertex>>;

const GitNode = (props: GitNodeProps) => {
  const branches = useAppSelector(state => branchSelectors.selectEntities(state));
  const [isHovering, toggleHovering] = useToggle(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const headText = () => {
    const firstHead = props.data.heads[0];
    if (firstHead) {
      const additional = props.data.heads.length - 1;
      const firstBranch = branches[firstHead];
      return `${firstBranch?.scope}/${firstBranch?.ref}${additional > 0 ? ` + ${additional}` : ''}`;
    }
    return undefined;
  };
  const text = props.data.heads.length > 0 ? headText() : props.data.oid.toString();
  const tooltip = useMemo((): string => {
    const commit = props.data;
    const headBranches = commit.heads.map(oid => branches[oid]).filter(isDefined);
    return `${
      headBranches.length > 0
        ? `Branches: ${headBranches.map(branch => `${branch.scope}/${branch.ref}`).join(',')}\n`
        : ''
    }Commit: ${commit.oid.toString()}\nParent: ${commit.parents.join(', ')}\nAuthor: ${
      commit.author.name
    } <${commit.author.email}>\nMessage: ${commit.message}`;
  }, [branches, props.data]);
  const color = props.data.color;
  const border = props.data.staged ? 'dashed' : '';
  const opacity = props.data.staged ? '0.6' : '1.0';

  return (
    <>
      <GraphTooltip disabled={!isHovering} content={tooltip} placement="bottom" />
      <Node
        color={color}
        border={border}
        opacity={opacity}
        onMouseEnter={() => toggleHovering(true)}
        onMouseLeave={() => toggleHovering(false)}
        onClick={() => console.log({ props, color, border, opacity })}
        onContextMenu={handleMenu}
      >
        <StyledHandle type="target" position={Position.Top} />
        <StyledHandle type="source" position={Position.Bottom} />
      </Node>
      <StyledText>{text}</StyledText>
      <ContextMenu open={open} anchorEl={anchorEl} node={props} onClose={handleClose} />
    </>
  );
};

const Node = styled('div')<{ color: Color; border: string; opacity?: string | undefined }>(
  props => ({
    width: 10,
    borderRadius: '50%',
    margin: 'auto',
    borderStyle: props.border,
    borderWidth: 'thin',
    opacity: props.opacity,
    background: props.color,
    padding: 5
  })
);

const StyledHandle = styled(Handle)(() => ({
  visibility: 'hidden'
}));

const StyledText = styled('div')(() => ({
  color: 'whitesmoke',
  fontSize: 6,
  width: 50,
  textAlign: 'center',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden'
}));

export const nodeTypes = {
  gitNode: GitNode
};

export default GitNode;
