import type {DraggableAttributes, DraggableSyntheticListeners} from '@dnd-kit/core';
import {Badge, Stack, Tooltip, Typography, styled} from '@mui/material';
import type {MouseEventHandler} from 'react';
import Handle from '../Handle';
import ActionsMenu, {type Action} from './ActionsMenu';

const MenuBar = (props: Props) => {
  return (
    <Badge
      anchorOrigin={{vertical: 'top', horizontal: 'right'}}
      color="error"
      overlap="rectangular"
      badgeContent={props.conflicts ?? 0}
      style={{width: '100%'}}
    >
      <StackBar
        direction="row"
        sx={{
          background:
            props.conflicts && props.conflicts > 0 ? 'rgb(255, 99, 71)' : 'rgb(25, 118, 210)',
        }}
      >
        {!props.dragOverlay && !props.fullscreen ? (
          <Handle
            draggable
            {...props.listeners}
            {...props.attributes}
          />
        ) : (
          <Handle />
        )}
        <Tooltip
          title={props.tooltip ?? props.name}
          enterDelay={1200}
          leaveDelay={500}
          placement="top"
          arrow
        >
          <Typography
            noWrap
            sx={{pt: 1, pb: 1, flexGrow: 1, userSelect: 'none'}}
            onClick={props.onClick}
          >
            {props.name}
          </Typography>
        </Tooltip>
        <ActionsMenu actions={props.actions} />
      </StackBar>
    </Badge>
  );
};

type OverlayProps = {
  dragOverlay: true;
  highlight?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
};

type DraggableProps = {
  dragOverlay?: false;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
};

export type Props = {
  name: string;
  tooltip?: string;
  actions: Action[];
  conflicts?: number | undefined;
  fullscreen?: boolean;
} & (OverlayProps | DraggableProps);

const StackBar = styled(Stack)(() => ({
  borderRadius: '10px 10px 0 0',
  color: 'rgba(0, 0, 0, 0.54)',
  width: '100%',
}));

export default MenuBar;
