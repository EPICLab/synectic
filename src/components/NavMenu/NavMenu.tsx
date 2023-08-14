import {
  Button,
  ClickAwayListener,
  Grow,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  styled
} from '@mui/material';
import React from 'react';
import { removeNullableProperties } from '../../containers/utils';

const NavMenu = ({ label, submenu }: NavMenuProps) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = () => setOpen(prevOpen => !prevOpen);

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <>
      <StyledButton
        ref={anchorRef}
        aria-controls={open ? `${label}-menu` : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        {label}
      </StyledButton>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        style={{ zIndex: 1000 }}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  id={`${label}-menu-list`}
                  onKeyDown={handleListKeyDown}
                >
                  {submenu.map(item => (
                    <NavItem
                      key={item.label}
                      label={item.label}
                      {...removeNullableProperties({ icon: item.icon, disabled: item.disabled })}
                      click={(event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
                        item.click(event);
                        setOpen(false);
                      }}
                    />
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

const StyledButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.secondary
}));

type NavMenuProps = {
  label: string;
  submenu: NavItemProps[];
};

export const NavItem = ({ icon, label, click, disabled }: NavItemProps) => {
  return (
    <MenuItem
      onClick={click}
      {...removeNullableProperties({ disabled: disabled })}
      dense
      sx={{ pl: 2, pr: 2, pt: 1, pb: 1 }}
    >
      <ListItemText>{label}</ListItemText>
      {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
    </MenuItem>
  );
};

export type NavItemProps = {
  label: string;
  icon?: JSX.Element;
  disabled?: boolean;
  click: (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
};

export default NavMenu;
