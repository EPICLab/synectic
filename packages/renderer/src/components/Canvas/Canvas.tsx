import {useDroppable} from '@dnd-kit/core';
import {styled} from '@mui/material';
import type {PropsWithChildren} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import canvasBackground from '../../../assets/canvas.png';
import Card from '../Card';
import DndCanvasContext from '../Dnd/DndCanvasContext';
import GitGraphSelect from '../GitGraph/GitGraphSelect';
import ModalComponent from '../Modal';
import Stack from '../Stack';
import CanvasMenu from './MenuBar';
import {useAppSelector} from '/@/store/hooks';
import cardSelectors from '/@/store/selectors/cards';
import modalSelectors from '/@/store/selectors/modals';
import stackSelectors from '/@/store/selectors/stacks';

const Canvas = ({children}: PropsWithChildren) => {
  const cards = useAppSelector(state => cardSelectors.selectAll(state));
  const stacks = useAppSelector(state => stackSelectors.selectAll(state));
  const modals = useAppSelector(state => modalSelectors.selectAll(state));
  const {isOver, setNodeRef} = useDroppable({
    id: 'Canvas',
    data: {
      type: 'canvas',
    },
  });

  return (
    <AppContainer>
      <CanvasMenu />
      <CanvasComponent
        id="Canvas"
        ref={setNodeRef}
        isOver={isOver}
      >
        <ErrorBoundary fallback={<Error>💥GitGraphSelect Error💥</Error>}>
          <GitGraphSelect />
        </ErrorBoundary>
        <DndCanvasContext>
          <ErrorBoundary fallback={<Error>💥Stack Error💥</Error>}>
            {stacks.map(stack => (
              <Stack
                key={stack.id}
                id={stack.id}
              />
            ))}
          </ErrorBoundary>
          <ErrorBoundary fallback={<Error>💥Card Error💥</Error>}>
            {cards.map(card =>
              card.captured ? null : (
                <Card
                  key={card.id}
                  id={card.id}
                />
              ),
            )}
          </ErrorBoundary>
          <ErrorBoundary fallback={<Error>💥Modal Error💥</Error>}>
            {modals.map(modal => (
              <ModalComponent
                key={modal.id}
                {...modal}
              />
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
  height: '100vh',
}));

const CanvasComponent = styled('div')<{isOver: boolean}>(props => ({
  flex: 1,
  background: `url(${canvasBackground}) center/auto fixed`,
  width: '100%',
  color: props.isOver ? 'green' : undefined,
}));

const Error = styled('div')(() => ({
  color: '#FF0000',
}));

export default Canvas;
