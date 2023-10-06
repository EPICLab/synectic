import { DarkMode, LightMode } from '@mui/icons-material';
import { styled } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@renderer/store/hooks';
import branchSelectors from '@renderer/store/selectors/branches';
import cardSelectors from '@renderer/store/selectors/cards';
import commitSelectors from '@renderer/store/selectors/commits';
import filetypeSelectors from '@renderer/store/selectors/filetypes';
import metafileSelectors from '@renderer/store/selectors/metafiles';
import modalSelectors from '@renderer/store/selectors/modals';
import repoSelectors from '@renderer/store/selectors/repos';
import stackSelectors from '@renderer/store/selectors/stacks';
import { modalAdded } from '@renderer/store/slices/modals';
import { DateTime } from 'luxon';
import { useContext, useState } from 'react';
import { AppThemeContext } from '../AppTheme';
import { fileOpenDialog } from '../Dialogs';
import NavMenu, { NavItemProps } from './NavMenu';

const isMac = window.api.globals.platform === 'darwin';

const CanvasMenu = () => {
  const metafiles = useAppSelector(state => metafileSelectors.selectAll(state));
  const cards = useAppSelector(state => cardSelectors.selectAll(state));
  const stacks = useAppSelector(state => stackSelectors.selectAll(state));
  const filetypes = useAppSelector(state => filetypeSelectors.selectAll(state));
  const modals = useAppSelector(state => modalSelectors.selectAll(state));
  const repos = useAppSelector(state => repoSelectors.selectAll(state));
  const branches = useAppSelector(state => branchSelectors.selectAll(state));
  const commits = useAppSelector(state => commitSelectors.selectAll(state));
  const { mode, toggleColorMode } = useContext(AppThemeContext);
  const [versions] = useState(window.electron.process.versions);
  const dispatch = useAppDispatch();

  const showStore = () => {
    console.group(
      `%cRedux Store : ${DateTime.local().toHTTP()}`,
      'background: lightblue; color: #444; padding: 3px; border-radius: 5px;'
    );
    console.log(`STACKS [${Object.keys(stacks).length}]`, stacks);
    console.log(`CARDS [${Object.keys(cards).length}]`, cards);
    console.log(`FILETYPES [${filetypes.length}]`, filetypes);
    console.log(`METAFILES [${metafiles.length}]`, metafiles);
    console.log(`REPOS [${repos.length}]`, repos);
    console.log(`BRANCHES [${branches.length}]`, branches);
    console.log(`COMMITS [${commits.length}]`, commits);
    console.log(`MODALS [${modals.length}]`, modals);
    console.groupEnd();
  };

  const fileMenu: NavItemProps[] = [
    {
      label: 'New...',
      click: () =>
        dispatch(
          modalAdded({
            id: window.api.uuid(),
            type: 'NewCardDialog'
          })
        )
    },
    ...(isMac
      ? [
          {
            label: 'Open...',
            click: () => dispatch(fileOpenDialog())
          }
        ]
      : [
          {
            label: 'Open File...',
            click: () => dispatch(fileOpenDialog({ properties: ['openFile', 'multiSelections'] }))
          },
          {
            label: 'Open Directory...',
            click: () =>
              dispatch(fileOpenDialog({ properties: ['openDirectory', 'multiSelections'] }))
          }
        ])
    // {
    //   label: 'Notify...',
    //   click: () => window.api.notifications.sendNotification('My custom message!')
    // },
    // {
    //   label: 'Context',
    //   click: async () => {
    //     console.log(`Executing in ${isRenderer()}`);
    //     const preloadContext = await window.api.context();
    //     console.log(`Preload in ${preloadContext}`);
    //   }
    // }
  ];

  const sysMenu: NavItemProps[] = [
    { label: 'View Datastore...', click: () => showStore() },
    {
      label: mode === 'light' ? 'Dark mode' : 'Light mode',
      icon: mode === 'light' ? <DarkMode /> : <LightMode />,
      click: () => toggleColorMode()
    }
  ];

  const helpMenu: NavItemProps[] = [
    {
      label: 'Website...',
      click: async () => {
        window.api.openExternal('https://nomatic.dev/synectic');
      }
    },
    {
      label: 'Repository...',
      click: async () => {
        window.api.openExternal('https://github.com/EPICLab/synectic/');
      }
    },
    {
      label: 'Release Notes...',
      click: async () => {
        window.api.openExternal('https://github.com/EPICLab/synectic/releases');
      }
    },
    {
      label: 'View License...',
      click: async () => {
        window.api.openExternal(
          'https://github.com/EPICLab/synectic/blob/5ec51f6dc9dc857cae58c5253c3334c8f33a63c4/LICENSE'
        );
      }
    },
    {
      label: 'Version',
      click: () => {
        const versionsMessage = `Synectic v${APP_VERSION}\nElectron v${versions.electron}\nChromium v${versions.chrome}\nNode v${versions.node}\nV8 v${versions.v8}`;
        dispatch(
          modalAdded({
            id: window.api.uuid(),
            type: 'Notification',
            options: {
              message: versionsMessage
            }
          })
        );
        console.log(versionsMessage);
      }
    }
  ];

  return (
    <NavBar>
      <NavMenu label="File" submenu={fileMenu} />
      <NavMenu label="System" submenu={sysMenu} />
      <NavMenu label="Help" submenu={helpMenu} />
    </NavBar>
  );
};

const NavBar = styled('div')(({ theme }) => ({
  padding: 1,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.secondary
}));

export default CanvasMenu;
