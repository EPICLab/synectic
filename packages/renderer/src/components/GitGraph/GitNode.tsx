import {clipboard, isDefined} from '#preload';
import {styled} from '@mui/material';
import type {Color} from '@syn-types/app';
import type {Prettify} from '@syn-types/util';
import {useMemo, useState, type MouseEvent} from 'react';
import {Handle, Position, type NodeProps} from 'reactflow';
import type {CommitVertex} from '../../containers/hooks/useGitGraph';
import useToggle from '../../containers/hooks/useToggle';
import {useAppSelector} from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import ContextMenu from './ContextMenu';
import GraphTooltip from './GraphTooltip';

export type GitNodeProps = Prettify<NodeProps<CommitVertex>>;

const GitNode = (props: GitNodeProps) => {
  const branches = useAppSelector(state => branchSelectors.selectEntities(state));
  const [isHovering, toggleHovering] = useToggle(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenu = (event: MouseEvent<HTMLDivElement>) => {
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
  const borderColor = props.selected ? '#F08080' : 'whitesmoke';
  const borderStyle = props.selected ? 'solid' : props.data.staged ? 'dashed' : '';
  const opacity = props.data.staged ? '0.6' : '1.0';

  const copyToClipboard = (text: string) => {
    clipboard.writeText(text);
  };

  return (
    <>
      <GraphTooltip
        disabled={!isHovering}
        content={tooltip}
        placement="bottom"
      />
      <Node
        color={color}
        borderStyle={borderStyle}
        borderColor={borderColor}
        opacity={opacity}
        onMouseEnter={() => toggleHovering(true)}
        onMouseLeave={() => toggleHovering(false)}
        onClick={() => {
          copyToClipboard(props.id);
          const node = props.data;
          console.log(node);
        }}
        onContextMenu={handleMenu}
      >
        <StyledHandle
          type="target"
          position={Position.Top}
        />
        <StyledHandle
          type="source"
          position={Position.Bottom}
        />
      </Node>
      <StyledText>{text}</StyledText>
      <ContextMenu
        open={open}
        anchorEl={anchorEl}
        node={props}
        onClose={handleClose}
      />
    </>
  );
};

const Node = styled('div')<{
  color: Color;
  borderStyle: string;
  borderColor: string;
  opacity?: string | undefined;
}>(props => ({
  width: 10,
  borderRadius: '50%',
  margin: 'auto',
  borderStyle: props.borderStyle,
  borderColor: props.borderColor,
  borderWidth: 'thin',
  opacity: props.opacity,
  background: props.color,
  padding: 5,
}));

const StyledHandle = styled(Handle)(() => ({
  visibility: 'hidden',
}));

const StyledText = styled('div')(() => ({
  color: 'whitesmoke',
  fontSize: 6,
  width: 50,
  textAlign: 'center',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}));

export const nodeTypes = {
  gitNode: GitNode,
};

export default GitNode;
