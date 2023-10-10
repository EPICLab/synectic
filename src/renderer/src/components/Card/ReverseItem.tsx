import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import { useState } from 'react';
import { Action } from './ActionsMenu';

type ItemProps = {
  icon: JSX.Element;
  name: string;
  tooltip?: string;
  onClick: () => void;
};

type MenuProps = {
  icon: JSX.Element;
  name: string;
  tooltip?: string;
  actionPrompt: string;
  actions: Action[];
};

export const ReverseListItem = (props: ItemProps) => {
  return (
    <ListItem dense disablePadding>
      <ListItemButton onClick={props.onClick}>
        {props.tooltip ? (
          <Tooltip title={props.tooltip}>
            <ListItemIcon>{props.icon}</ListItemIcon>
          </Tooltip>
        ) : (
          <ListItemIcon>{props.icon}</ListItemIcon>
        )}
        <ListItemText primary={props.name} sx={{ maxWidth: 160, overflowWrap: 'break-word' }} />
      </ListItemButton>
    </ListItem>
  );
};

export const ReverseListMenu = (props: MenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <ListItem dense disablePadding>
      <ListItemButton
        id={`${props.name}-menu-button`}
        aria-controls={open ? `${props.name}-menu` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        {props.tooltip ? (
          <Tooltip title={props.tooltip}>
            <ListItemIcon>{props.icon}</ListItemIcon>
          </Tooltip>
        ) : (
          <ListItemIcon>{props.icon}</ListItemIcon>
        )}
        <ListItemText primary={props.name} />
      </ListItemButton>
      <Menu
        anchorEl={anchorEl}
        id={`${props.name}-reverse-menu`}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              left: 14,
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                left: 22,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0
              }
            }
          }
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <MenuItem dense disabled divider>
          <ListItemText>{props.actionPrompt}</ListItemText>
        </MenuItem>
        {props.actions.map((action, index) => (
          <MenuItem dense key={index} onClick={action.onClick}>
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>{action.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </ListItem>
  );
};
