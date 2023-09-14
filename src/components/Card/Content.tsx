import { LinearProgress, styled } from '@mui/material';
import React from 'react';
import { useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import { Card } from '../../store/slices/cards';
import { UUID } from '../../store/types';
import Editor from '../Editor';
import Explorer from '../Explorer';
import Diff from '../Diff';
import EditorReverse from '../Editor/EditorReverse';
import ExplorerReverse from '../Explorer/ExplorerReverse';
import DiffReverse from '../Diff/DiffReverse';

const Content = ({ reverse = false, id }: { reverse?: boolean; id: UUID }) => {
  const card = useAppSelector(state => cardSelectors.selectById(state, id));

  return (
    <>
      {card?.loading !== undefined ? (
        <LinearProgress variant="determinate" value={card.loading} />
      ) : null}
      <ContentComponent loading={card?.loading !== undefined ? true : false}>
        {reverse ? getCardTypeReverseContent(card) : getCardTypeContent(card)}
      </ContentComponent>
    </>
  );
};

const getCardTypeContent = (card: Card | undefined) => {
  switch (card?.type) {
    case 'Diff':
      return <Diff metafileId={card.metafile} />;
    case 'Editor':
      return <Editor id={card.metafile} expanded={card.expanded} />;
    case 'Explorer':
      return <Explorer id={card.metafile} />;
    default:
      return null;
  }
};

const getCardTypeReverseContent = (card: Card | undefined) => {
  switch (card?.type) {
    case 'Diff':
      return <DiffReverse {...card} />;
    case 'Editor':
      return <EditorReverse {...card} />;
    case 'Explorer':
      return <ExplorerReverse {...card} />;
    default:
      return null;
  }
};

const ContentComponent = styled('div', { shouldForwardProp: prop => prop !== 'loading' })<{
  loading: boolean;
}>(loading => ({
  height: loading ? 'calc(100% - 44px)' : 'calc(100% - 40px)',
  borderRadius: '0 0 10px 10px'
}));

export default Content;
