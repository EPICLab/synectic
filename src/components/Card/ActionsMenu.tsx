import { MoreVert } from '@mui/icons-material';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import React, { useState } from 'react';

export type Action = {
  icon: JSX.Element;
  name: string;
  tooltip?: string;
  disabled?: boolean;
  onClick: () => void;
};

const ActionsMenu = ({ actions }: { actions: Action[] }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        sx={{
          alignSelf: 'flex-end',
          height: 40,
          color: 'inherit',
          '& .MuiSvgIcon-root': { height: '0.75em' }
        }}
        onClick={handleClick}
      >
        <MoreVert />
      </IconButton>
      <Menu
        id="card-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        MenuListProps={{
          dense: true,
          'aria-labelledby': 'card-menu'
        }}
      >
        {actions.map((action, index) => (
          <MenuItem key={index} onClick={action.onClick} disabled={action.disabled ?? false}>
            <ListItemIcon>{action.icon}</ListItemIcon>
            {action.tooltip ? (
              <Tooltip title={action.tooltip} placement="top-end">
                <ListItemText>{action.name}</ListItemText>
              </Tooltip>
            ) : (
              <ListItemText>{action.name}</ListItemText>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ActionsMenu;
