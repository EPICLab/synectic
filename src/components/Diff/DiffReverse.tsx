import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { Card } from '../../store/slices/cards';
import { Badge, List } from '@mui/material';
import { ReverseListItem } from '../Card/ReverseItem';
import { Source } from '@mui/icons-material';
import cardSelectors from '../../store/selectors/cards';
import { modalAdded } from '../../store/slices/modals';

const DiffReverse = (props: Card) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, props.metafile));
  const targetCards = useAppSelector(state =>
    cardSelectors.selectByIds(state, metafile?.targets ?? [])
  );
  const targetMetafiles = useAppSelector(state =>
    metafileSelectors.selectByIds(
      state,
      targetCards.map(c => c.metafile)
    )
  );
  const dispatch = useAppDispatch();

  const copyToClipboard = (text: string) => {
    window.api.clipboard.writeText(text);
    dispatch(
      modalAdded({
        id: window.api.uuid(),
        type: 'Notification',
        options: {
          message: `'${text}' copied to clipboard`
        }
      })
    );
  };

  return (
    <List dense>
      {targetMetafiles.map((metafile, idx) => (
        <ReverseListItem
          key={idx}
          icon={
            <Badge badgeContent={idx + 1} color="primary">
              <Source />
            </Badge>
          }
          name={metafile?.path ?? ''}
          tooltip="Filepath"
          onClick={() => copyToClipboard(metafile?.path ?? '')}
        />
      ))}
    </List>
  );
};

export default DiffReverse;
