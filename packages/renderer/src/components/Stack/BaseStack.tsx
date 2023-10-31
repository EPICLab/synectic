import {isDefined} from '#preload';
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import type {Transform} from '@dnd-kit/utilities';
import {CSS} from '@dnd-kit/utilities';
import {Close, Difference} from '@mui/icons-material';
import {IconButton, Tooltip, styled} from '@mui/material';
import type {UUID} from '@syn-types/app';
import {forwardRef, useRef} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {useMergeRefs} from 'use-callback-ref';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import stackSelectors from '../../store/selectors/stacks';
import {createCard} from '../../store/thunks/cards';
import {createMetafile} from '../../store/thunks/metafiles';
import {pushCards, removeStack} from '../../store/thunks/stacks';
import Card from '../Card/Card';
import DndStackContext from '../Dnd/DndStackContext';
import Handle from '../Handle';

const BaseStack = forwardRef<HTMLDivElement, Props>(({id, ...props}, ref) => {
  const stack = useAppSelector(state => stackSelectors.selectById(state, id));
  const first = useAppSelector(state =>
    cardSelectors.selectById(state, stack && stack.cards.length >= 1 ? stack?.cards[0] ?? '' : ''),
  );
  const firstMetafile = useAppSelector(state =>
    metafileSelectors.selectById(state, first?.metafile ?? ''),
  );
  const second = useAppSelector(state =>
    cardSelectors.selectById(state, stack && stack.cards.length >= 2 ? stack?.cards[1] ?? '' : ''),
  );
  const localRef = useRef<HTMLDivElement | null>(null);
  const mergedRefs = useMergeRefs([ref, localRef]);
  const dispatch = useAppDispatch();

  const isDiffable = () => {
    if (stack?.cards.length !== 2) return false;
    if (isDefined(first) && isDefined(second)) {
      return first.type === second.type;
    } else {
      return false;
    }
  };

  return (
    <StackComponent
      {...props}
      x={stack?.x}
      y={stack?.y}
      cards={stack?.cards}
      ref={mergedRefs}
    >
      {!props.dragOverlay ? (
        <Handle
          draggable
          {...props.listeners}
          {...props.attributes}
        />
      ) : (
        <Handle />
      )}
      {isDiffable() ? (
        <Tooltip
          title={'Generate the diff of these cards'}
          placement="top-end"
        >
          <IconButton
            aria-label="stack-diff"
            sx={{
              gridColumnStart: 'buttons',
              color: 'inherit',
              mr: 0.25,
              aspectRatio: 1 / 1,
              '& .MuiSvgIcon-root': {height: '0.75em'},
            }}
            onClick={async () => {
              if (first && second) {
                const diffCardName = `${first?.name} Δ ${second?.name}`;
                const diffMetafile = await dispatch(
                  createMetafile({
                    metafile: {
                      name: diffCardName,
                      handler: 'Diff',
                      filetype: firstMetafile?.filetype ?? 'Text',
                      targets: [first.id, second.id],
                    },
                  }),
                ).unwrap();
                const diffCard = await dispatch(createCard({metafile: diffMetafile})).unwrap();
                await dispatch(pushCards({stack: id, cards: [diffCard]}));
              }
            }}
          >
            <Difference />
          </IconButton>
        </Tooltip>
      ) : null}
      <IconButton
        aria-label="stack-close"
        sx={{
          gridColumnStart: 'buttons',
          color: 'inherit',
          mr: 0.25,
          aspectRatio: 1 / 1,
          '& .MuiSvgIcon-root': {height: '0.75em'},
        }}
        onClick={() => {
          if (stack) dispatch(removeStack({stack: stack.id}));
        }}
      >
        <Close />
      </IconButton>
      <ErrorBoundary fallback={<Error>💥Child Error💥</Error>}>
        <DndStackContext
          id={id}
          ref={localRef}
        >
          <SortableContext
            items={stack?.cards ?? []}
            strategy={verticalListSortingStrategy}
          >
            {stack?.cards.map((id, index) => (
              <Card
                key={id}
                id={id}
                sortableIndex={index}
              />
            ))}
          </SortableContext>
        </DndStackContext>
      </ErrorBoundary>
    </StackComponent>
  );
});

type OverlayProps = {
  dragOverlay: true;
  highlight?: boolean;
};

type DraggableProps = {
  dragOverlay?: false;
  highlight?: boolean;
  dragging?: boolean;
  transform: Transform | null;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

type InternalProps = {
  cards: UniqueIdentifier[] | undefined;
  x: number | undefined;
  y: number | undefined;
};

type Props = {id: UUID} & (OverlayProps | DraggableProps);
type StyledProps = (OverlayProps | DraggableProps) & InternalProps;

const StackComponent = styled('div')<StyledProps>(props => ({
  background: 'rgba(102, 204, 117, 0.6)',
  height: 420 + (props.cards?.length ?? 0) * 15,
  width: 265 + (props.cards?.length ?? 0) * 15,
  borderRadius: 5,
  border: '0.5px solid rgba(125, 125, 125, 1)',
  position: 'fixed',
  zIndex: 1,
  color: 'rgba(0, 0, 0, 0.54)',
  boxShadow: props.highlight ? '0 0 3pt 1pt rgba(255, 165, 0, 0.75)' : undefined,
  transform: props.dragOverlay ? undefined : CSS.Translate.toString(props.transform),
  left: props.dragOverlay ? undefined : props.x,
  top: props.dragOverlay ? undefined : props.y,
  visibility: !props.dragOverlay && props.dragging ? 'hidden' : 'unset',
}));

const Error = styled('div')(() => ({
  color: '#FF0000',
}));

BaseStack.displayName = 'BaseStack';
export default BaseStack;
