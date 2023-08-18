import { useDroppable } from '@dnd-kit/core';
import { DarkMode, LightMode } from '@mui/icons-material';
import { styled } from '@mui/material';
import { DateTime } from 'luxon';
import React, { PropsWithChildren, useContext } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import version from '../../../version';
import { fileOpenDialog } from '../../containers/dialogs';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import commitSelectors from '../../store/selectors/commits';
import filetypeSelectors from '../../store/selectors/filetypes';
import metafileSelectors from '../../store/selectors/metafiles';
import modalSelectors from '../../store/selectors/modals';
import repoSelectors from '../../store/selectors/repos';
import stackSelectors from '../../store/selectors/stacks';
import { modalAdded } from '../../store/slices/modals';
import { AppThemeContext } from '../AppTheme';
import Card from '../Card';
import DndCanvasContext from '../Dnd/DndCanvasContext';
import GitGraphSelect from '../GitGraph/GitGraphSelect';
import ModalComponent from '../Modal';
import NavMenu, { NavItemProps } from '../NavMenu';
import Stack from '../Stack';

const isMac = window.api.globals.platform === 'darwin';

const Canvas = ({ children }: PropsWithChildren) => {
  const metafiles = useAppSelector(state => metafileSelectors.selectAll(state));
  const cards = useAppSelector(state => cardSelectors.selectAll(state));
  const stacks = useAppSelector(state => stackSelectors.selectAll(state));
  const filetypes = useAppSelector(state => filetypeSelectors.selectAll(state));
  const modals = useAppSelector(state => modalSelectors.selectAll(state));
  const repos = useAppSelector(state => repoSelectors.selectAll(state));
  const branches = useAppSelector(state => branchSelectors.selectAll(state));
  const commits = useAppSelector(state => commitSelectors.selectAll(state));
  const dispatch = useAppDispatch();
  const { mode, toggleColorMode } = useContext(AppThemeContext);
  const { isOver, setNodeRef } = useDroppable({
    id: 'Canvas',
    data: {
      type: 'canvas'
    }
  });

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

  const showStore = () => {
    console.group(
      `%cRedux Store : ${DateTime.local().toHTTP()}`,
      'background: lightblue; color: #444; padding: 3px; border-radius: 5px;'
    );
    console.log(`STACKS [${Object.keys(stacks).length}]`, stacks);
    console.log(`CARDS [${Object.keys(cards).length}]`, cards);
    console.log(`FILETYPES [${filetypes.length}]`, filetypes);
    console.log(`METAFILES [${metafiles.length}]`, metafiles);
    // console.log(`CACHE [${cache.length}]`, cache);
    console.log(`REPOS [${repos.length}]`, repos);
    console.log(`BRANCHES [${branches.length}]`, branches);
    console.log(`COMMITS [${commits.length}]`, commits);
    console.log(`MODALS [${modals.length}]`, modals);
    console.groupEnd();
  };

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
      click: () =>
        dispatch(
          modalAdded({
            id: window.api.uuid(),
            type: 'Notification',
            options: { message: `Synectic v${version}` }
          })
        )
    }
  ];

  return (
    <AppContainer>
      <NavBar>
        <NavMenu label="File" submenu={fileMenu} />
        <NavMenu label="System" submenu={sysMenu} />
        <NavMenu label="Help" submenu={helpMenu} />
      </NavBar>
      <CanvasComponent id="Canvas" ref={setNodeRef} isOver={isOver}>
        <ErrorBoundary fallback={<Error>💥GitGraphSelect Error💥</Error>}>
          <GitGraphSelect />
        </ErrorBoundary>
        <DndCanvasContext>
          <ErrorBoundary fallback={<Error>💥Stack Error💥</Error>}>
            {stacks.map(stack => (
              <Stack key={stack.id} id={stack.id} />
            ))}
          </ErrorBoundary>
          <ErrorBoundary fallback={<Error>💥Card Error💥</Error>}>
            {cards.map(card => (card.captured ? null : <Card key={card.id} id={card.id} />))}
          </ErrorBoundary>
          <ErrorBoundary fallback={<Error>💥Modal Error💥</Error>}>
            {modals.map(modal => (
              <ModalComponent key={modal.id} {...modal} />
            ))}
          </ErrorBoundary>
          {children}
        </DndCanvasContext>
      </CanvasComponent>
    </AppContainer>
  );
};

const AppContainer = styled('div')(() => ({
  display: 'flex',
  flexFlow: 'column',
  height: '100vh'
}));

const NavBar = styled('div')(({ theme }) => ({
  padding: 1,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.secondary
}));

const CanvasComponent = styled('div')<{ isOver: boolean }>(props => ({
  flex: 1,
  background: `url(${require('../../assets/canvas.png')}) center/auto fixed`,
  width: '100%',
  color: props.isOver ? 'green' : undefined
}));

const Error = styled('div')(() => ({
  color: '#FF0000'
}));

export default Canvas;
