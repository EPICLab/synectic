import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
  UniqueIdentifier,
} from '@dnd-kit/core';
import type {Transform} from '@dnd-kit/utilities';
import {CSS} from '@dnd-kit/utilities';
import {
  AspectRatio,
  Close,
  ContentCopy,
  Merge,
  PlaylistAdd,
  PlaylistRemove,
  ReplyAll,
  Save,
} from '@mui/icons-material';
import {styled} from '@mui/material';
import type {UUID} from '@syn-types/app';
import type {Property} from 'csstype';
import type {PropsWithChildren} from 'react';
import {forwardRef} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import {cardUpdated} from '../../store/slices/cards';
import {
  isFilebasedMetafile,
  isVersionedMetafile,
  isVirtualMetafile,
} from '../../store/slices/metafiles';
import {modalAdded} from '../../store/slices/modals';
import {createCard, removeCard} from '../../store/thunks/cards';
import {
  createMetafile,
  revertChanges,
  saveFile,
  updateVersionedMetafile,
} from '../../store/thunks/metafiles';
import {
  add,
  isDefined,
  isEqualPaths,
  isModified,
  isStaged,
  isUnmerged,
  restore,
  sep,
  uuid,
} from '#preload';
import {fileSaveDialog} from '../Dialogs';
import {GitCommit} from '../GitIcons';
import Content from './Content';
import MenuBar from './MenuBar';
import type {Action} from './ActionsMenu';

const BaseCard = forwardRef<HTMLDivElement, PropsWithChildren<Props>>(
  ({id, children, ...props}, ref) => {
    const card = useAppSelector(state => cardSelectors.selectById(state, id));
    const metafile = useAppSelector(state =>
      metafileSelectors.selectById(state, card?.metafile ?? ''),
    );
    const repo = useAppSelector(state => repoSelectors.selectById(state, metafile?.repo ?? ''));
    const branch = useAppSelector(state =>
      branchSelectors.selectById(state, metafile?.branch ?? ''),
    );

    const name =
      isVersionedMetafile(metafile) && isDefined(repo) && isEqualPaths(metafile.path, repo.root)
        ? repo.name
        : card
        ? card.type === 'Explorer'
          ? `${sep}${card.name}`
          : card.name
        : '';
    const saveDisabled =
      !isDefined(metafile) || metafile.handler !== 'Editor' || metafile.state !== 'modified';
    const stageDisabled = !(
      isVersionedMetafile(metafile) &&
      metafile.handler === 'Editor' &&
      (isModified(metafile.status) || isUnmerged(metafile.status))
    );
    const commitDisabled =
      !isDefined(branch) ||
      !isVersionedMetafile(metafile) ||
      !isEqualPaths(branch.root, metafile.path) ||
      branch.status !== 'uncommitted';
    const dispatch = useAppDispatch();

    const actions: Action[] = [
      {
        icon: <Save />,
        name: 'Save',
        disabled: saveDisabled,
        onClick: () =>
          isFilebasedMetafile(metafile)
            ? dispatch(saveFile({id: metafile.id, filepath: metafile.path}))
            : isVirtualMetafile(metafile)
            ? dispatch(fileSaveDialog(metafile))
            : null,
      },
      {
        icon: <ReplyAll />,
        name: 'Revert',
        tooltip: 'Undo changes that have not been commited to the version control system',
        disabled:
          metafile?.handler !== 'Editor' ||
          !isVersionedMetafile(metafile) ||
          !['*modified', '*added', '*deleted'].includes(metafile.status),
        onClick: () => {
          if (isVersionedMetafile(metafile)) dispatch(revertChanges(metafile));
        },
      },
      {
        icon:
          isVersionedMetafile(metafile) && isStaged(metafile.status) ? (
            <PlaylistRemove />
          ) : (
            <PlaylistAdd />
          ),
        name: isVersionedMetafile(metafile) && isStaged(metafile.status) ? 'Unstage' : 'Stage',
        tooltip:
          isVersionedMetafile(metafile) && isStaged(metafile.status)
            ? 'Unstage changes to this file in VCS'
            : 'Stage changes to this file in VCS',
        disabled: stageDisabled,
        onClick: async () => {
          if (isVersionedMetafile(metafile)) {
            if (isStaged(metafile.status)) {
              await restore({filepath: metafile.path, staged: true});
            } else {
              await add(metafile.path);
            }

            await dispatch(updateVersionedMetafile(metafile.id));
          }
        },
      },
      {
        icon: <GitCommit fontSize="small" />,
        name: 'Commit',
        tooltip: 'Open dialog for committing into the branch associated with this file',
        disabled: commitDisabled,
        onClick: () => {
          if (isVersionedMetafile(metafile))
            dispatch(
              modalAdded({
                id: uuid(),
                type: 'CommitDialog',
                repo: metafile.repo,
                branch: metafile.branch,
              }),
            );
        },
      },
      {
        icon: <Merge fontSize="small" />,
        name: 'Merge',
        tooltip: 'Open dialog for merging into the branch associated with this file',
        disabled: !isVersionedMetafile(metafile) && branch?.status !== 'clean',
        onClick: () => {
          if (isVersionedMetafile(metafile))
            dispatch(
              modalAdded({
                id: uuid(),
                type: 'MergeDialog',
                repo: metafile.repo,
                base: metafile.branch,
              }),
            );
        },
      },
      {
        icon: <ContentCopy fontSize="small" />,
        name: 'Duplicate',
        disabled: !isDefined(metafile),
        onClick: async () => {
          const duplicateMetafile = isDefined(metafile)
            ? await dispatch(createMetafile({metafile: metafile})).unwrap()
            : undefined;
          if (duplicateMetafile) await dispatch(createCard({metafile: duplicateMetafile}));
        },
      },
      {
        icon: <AspectRatio />,
        name: 'Fullscreen',
        onClick: () => (card ? dispatch(cardUpdated({...card, expanded: !card.expanded})) : null),
      },
      {
        icon: <Close />,
        name: 'Close',
        onClick: () => (card ? dispatch(removeCard({card: card.id})) : null),
      },
    ];

    return (
      <CardComponent
        {...props}
        x={card?.x}
        y={card?.y}
        captured={card?.captured}
        expanded={card?.expanded ?? false}
        flipped={card?.flipped ?? false}
        ref={ref}
      >
        <FlipAnimation
          {...props}
          x={undefined}
          y={undefined}
          expanded={card?.expanded ?? false}
          captured={card?.captured}
          flipped={card?.flipped ?? false}
        >
          <FlipFront>
            <MenuBar
              name={name}
              actions={actions}
              onClick={() =>
                card ? dispatch(cardUpdated({...card, flipped: !card?.flipped})) : null
              }
              conflicts={metafile?.conflicts?.length}
              fullscreen={card?.expanded ?? false}
              {...props}
            />
            <ErrorBoundary fallback={<Error>💥Content Error💥</Error>}>
              <Content id={id} />
              {children}
            </ErrorBoundary>
          </FlipFront>
          <FlipBack>
            <MenuBar
              name={name}
              actions={actions}
              onClick={() =>
                card ? dispatch(cardUpdated({...card, flipped: !card?.flipped})) : null
              }
              conflicts={metafile?.conflicts?.length ?? 0}
              {...props}
            />
            <ErrorBoundary fallback={<Error>💥ContentBack Error💥</Error>}>
              <Content
                reverse
                id={id}
              />
              {children}
            </ErrorBoundary>
          </FlipBack>
        </FlipAnimation>
      </CardComponent>
    );
  },
);

type OverlayProps = {
  dragOverlay: true;
  highlight?: boolean;
  sortableIndex?: number | undefined;
};

type DraggableProps = {
  dragOverlay?: false;
  highlight?: boolean;
  sortableIndex?: number | undefined;
  dragging?: boolean;
  transform: Transform | null;
  transition: string | undefined;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

type InternalProps = {
  captured: UniqueIdentifier | undefined;
  expanded: boolean;
  flipped: boolean;
  x: number | undefined;
  y: number | undefined;
};

export type Props = {id: UUID} & (OverlayProps | DraggableProps);
type StyledProps = (OverlayProps | DraggableProps) & InternalProps;

const getBoxShadowStyle = (props: StyledProps): Property.BoxShadow | undefined => {
  if (props.highlight) return '0 0 3pt 1pt rgba(102, 204, 117, 0.75)';
  if (props.dragOverlay) return '0 35px 70px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)';
  if (props.captured) return undefined;
  return '0 7px 14px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)';
};

const CardComponent = styled('div')<StyledProps>(props => ({
  background: 'transparent',
  color: props.theme.palette.divider,
  height: props.expanded ? 'calc(100% - 70px)' : 350,
  width: props.expanded ? '100%' : 250,
  marginTop: props.sortableIndex === undefined ? undefined : props.sortableIndex * 15,
  marginLeft: props.sortableIndex === undefined ? undefined : (props.sortableIndex + 1) * 15,
  borderRadius: 10,
  position: props.captured ? 'absolute' : 'fixed',
  transform: props.dragOverlay ? undefined : CSS.Translate.toString(props.transform),
  transition: props.dragOverlay ? undefined : props.transition,
  perspective: 1000,
  zIndex: props.expanded ? 1000 : 1,
  left: props.expanded ? 0 : props.dragOverlay || props.captured ? undefined : props.x,
  top: props.expanded ? 38.5 : props.dragOverlay || props.captured ? undefined : props.y,
  visibility: !props.dragOverlay && props.dragging ? 'hidden' : 'unset',
}));

const FlipAnimation = styled('div')<StyledProps>(props => ({
  position: 'relative',
  background:
    props.theme.palette.mode === 'light' ? props.theme.palette.background.paper : 'rgb(89, 87, 90)',
  border: '1px solid rgb(171, 178, 191)',
  height: '100%',
  width: '100%',
  boxShadow: props.flipped ? 'unset' : getBoxShadowStyle(props),
  borderRadius: 10,
  transition: 'transform 0.8s',
  transformStyle: 'preserve-3d',
  transform: !props.expanded && props.flipped ? 'rotateY(180deg)' : 'none',
}));

const FlipFront = styled('div')(() => ({
  position: 'absolute',
  height: '100%',
  width: '100%',
  borderRadius: 10,
  backfaceVisibility: 'hidden',
}));

const FlipBack = styled('div')(() => ({
  position: 'absolute',
  height: '100%',
  width: '100%',
  borderRadius: 10,
  backfaceVisibility: 'hidden',
  transform: 'rotateY(180deg)',
}));

const Error = styled('div')(() => ({
  color: '#FF0000',
}));

BaseCard.displayName = 'BaseCard';
export default BaseCard;
