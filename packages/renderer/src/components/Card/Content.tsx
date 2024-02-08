import {LinearProgress, styled} from '@mui/material';
import type {UUID} from '@syn-types/app';
import type {Card} from '@syn-types/card';
import {useAppSelector} from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import Editor, {EditorReverse} from '../Editor';
import Explorer, {ExplorerReverse} from '../Explorer';
import Diff, {DiffReverse} from '../Diff';

const Content = ({reverse = false, id}: {reverse?: boolean; id: UUID}) => {
  const card = useAppSelector(state => cardSelectors.selectById(state, id));
  const loading = card?.loading !== undefined;

  return (
    <>
      {loading ? (
        <LinearProgress
          variant="determinate"
          value={card.loading}
        />
      ) : null}
      <ContentComponent loading={loading}>
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
      return (
        <Editor
          id={card.metafile}
          flipped={card.flipped}
          expanded={card.expanded}
        />
      );
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

const ContentComponent = styled('div', {shouldForwardProp: prop => prop !== 'loading'})<{
  loading: boolean;
}>(props => ({
  borderRadius: '0 0 10px 10px',
  height: props.loading ? 'calc(100% - 44px)' : 'calc(100% - 40px)',
}));

export default Content;
