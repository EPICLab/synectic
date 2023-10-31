import {clipboard, uuid} from '#preload';
import {Source} from '@mui/icons-material';
import {Badge, List} from '@mui/material';
import type {Card} from '@syn-types/card';
import {ReverseListItem} from '../Card/ReverseItem';
import {useAppDispatch, useAppSelector} from '/@/store/hooks';
import cardSelectors from '/@/store/selectors/cards';
import metafileSelectors from '/@/store/selectors/metafiles';
import {modalAdded} from '/@/store/slices/modals';

const DiffReverse = (props: Card) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, props.metafile));
  const targetCards = useAppSelector(state =>
    cardSelectors.selectByIds(state, metafile?.targets ?? []),
  );
  const targetMetafiles = useAppSelector(state =>
    metafileSelectors.selectByIds(
      state,
      targetCards.map(c => c.metafile),
    ),
  );
  const dispatch = useAppDispatch();

  const copyToClipboard = (text: string) => {
    clipboard.writeText(text);
    dispatch(
      modalAdded({
        id: uuid(),
        type: 'Notification',
        message: `'${text}' copied to clipboard`,
      }),
    );
  };

  return (
    <List dense>
      {targetMetafiles.map((metafile, idx) => (
        <ReverseListItem
          key={idx}
          icon={
            <Badge
              badgeContent={idx + 1}
              color="primary"
            >
              <Source />
            </Badge>
          }
          name={metafile?.path ?? 'No Filepath'}
          tooltip="Filepath"
          onClick={() => copyToClipboard(metafile?.path ?? '')}
        />
      ))}
    </List>
  );
};

export default DiffReverse;
