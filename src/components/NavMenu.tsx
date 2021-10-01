import React from 'react';
import Button from '@material-ui/core/Button';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';

export type NavItemProps = {
  label: string;
  disabled?: boolean;
  click: (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
}

export const NavItem: React.FunctionComponent<NavItemProps> = ({ label, click, disabled }) => {
  return (
    <MenuItem onClick={click} disabled={disabled}>{label}</ MenuItem>
  );
}

type NavMenuProps = {
  label: string;
  submenu: NavItemProps[];
}

export const NavMenu: React.FunctionComponent<NavMenuProps> = ({ label, submenu }) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = () => setOpen((prevOpen) => !prevOpen);

  const handleClose = (event: React.MouseEvent<EventTarget>) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <>
      <Button ref={anchorRef} aria-controls={open ? `${label}-menu` : undefined} aria-haspopup='true' onClick={handleToggle}>
        {label}
      </Button>
      <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList autoFocusItem={open} id={`${label}-menu-list`} onKeyDown={handleListKeyDown}>
                  {submenu.map(item => <NavItem key={item.label}
                    label={item.label}
                    disabled={item.disabled}
                    click={(event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
                      item.click(event);
                      setOpen(false);
                    }} />)}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}