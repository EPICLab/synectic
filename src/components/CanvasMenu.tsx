import React from 'react';
import { Menu } from 'electron';
import Button from '@material-ui/core/Button';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      backgroundColor: 'rgba(232, 233, 233, 1)',
      padding: theme.spacing(0.25),
    },
  })
);

const isMac = process.platform === 'darwin';

const MenuTemplate: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New...',
        click: () => console.log('need to fire off a Redux event to start the NewCardDialog')
      },
      ...(isMac ? [{
        label: 'Open...',
        click: () => console.log('need to fire off a Redux event for FilePickerDialog with openFile & openDirectory')
      }] : [{
        label: 'Open File...',
        click: () => console.log('need to fire off a Redux event for FilePickerDialog with openFile only')
      }, {
        label: 'Open Directory...',
        click: () => console.log('need to fire off a Redux event for FilePickerDialog with openDirectory only')
      }])
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Branches',
        click: () => console.log('need to fire off a Redux event for RepoBranchList.VersionStatusComponent')
      }
    ]
  }
];

const BannerMenu: React.FunctionComponent<Electron.MenuItem> = props => {
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
    <div>
      <Button ref={anchorRef} aria-controls={open ? `${props.label}-menu-list` : undefined} aria-haspopup='true' onClick={handleToggle}>
        {props.label}
      </Button>
      <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList autoFocusItem={open} id='file-menu-list' onKeyDown={handleListKeyDown}>
                  {props.submenu && props.submenu.items.map(item => <MenuItem key={item.id} onClick={handleClose}>{item.label}</MenuItem>)}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  )
}

const CanvasMenu: React.FunctionComponent = () => {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const menus = Menu.buildFromTemplate(MenuTemplate);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  }

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
    <div className={classes.root} >
      { menus.items.map(menu => <BannerMenu key={menu.id} {...menu} />)}
      <div>
        <Button ref={anchorRef} aria-controls={open ? 'file-menu-list' : undefined} aria-haspopup='true' onClick={handleToggle}>
          File
        </Button>
        <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
          {({ TransitionProps, placement }) => (
            <Grow {...TransitionProps} style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}>
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList autoFocusItem={open} id='file-menu-list' onKeyDown={handleListKeyDown}>
                    <MenuItem onClick={handleClose}>New...</MenuItem>
                    <MenuItem onClick={handleClose}>Open...</MenuItem>
                    <MenuItem onClick={handleClose}>Close</MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    </div>
  );
}

export default CanvasMenu;
