import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { Badge, Stack, Tooltip, Typography, styled } from '@mui/material';
import React from 'react';
import Handle from '../Handle';
import ActionsMenu, { Action } from './ActionsMenu';

const MenuBar = (props: Props) => {
  return (
    <Badge
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      color="error"
      overlap="rectangular"
      badgeContent={props.conflicts ?? 0}
    >
      <StackBar
        direction="row"
        sx={{
          background:
            props.conflicts && props.conflicts > 0 ? 'rgb(255, 99, 71)' : 'rgb(25, 118, 210)'
        }}
      >
        {!props.dragOverlay ? (
          <Handle draggable {...props.listeners} {...props.attributes} />
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
          <Typography noWrap sx={{ pt: 1, pb: 1, flexGrow: 1 }} onClick={props.onClick}>
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
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
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
} & (OverlayProps | DraggableProps);

const StackBar = styled(Stack)(() => ({
  borderRadius: '10px 10px 0 0',
  color: 'rgba(0, 0, 0, 0.54)',
  width: 248
}));

export default MenuBar;
