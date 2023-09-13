import { ExactlyOne } from '../../containers/utils';
import { createAppAsyncThunk } from '../hooks';
import cardSelectors from '../selectors/cards';
import stackSelectors from '../selectors/stacks';
import { cardAdded, cardRemoved, cardUpdated } from '../slices/cards';
import { stackUpdated } from '../slices/stacks';
import { PathLike, UUID } from '../types';
import { Metafile } from '../slices/metafiles';
import { DateTime } from 'luxon';
import { fetchMetafile } from './metafiles';

/**
 * Create a new Card component that is added to the Redux store and the UI.
 * @param path The relative or absolute path to a file or directory.
 * @param metafile The initial Metafile object that should be encapsulated within the new Card component.
 * @returns {UUID} The UUID of the new Card component.
 */
export const createCard = createAppAsyncThunk<
  UUID,
  ExactlyOne<{ path: PathLike; metafile: Metafile }>
>('cards/createCard', async (input, thunkAPI) => {
  const cardId = window.api.uuid();
  const card = thunkAPI.dispatch(
    cardAdded({
      id: cardId,
      name: input.metafile ? input.metafile.name : window.api.fs.extractFilename(input.path),
      type: input.metafile?.handler ?? 'Editor',
      metafile: input.metafile?.id ?? '',
      created: DateTime.local().valueOf(),
      modified: DateTime.local().valueOf(),
      captured: undefined,
      expanded: false,
      flipped: false,
      loading: undefined,
      x: 40,
      y: 40
    })
  ).payload;
  if (input.path) {
    const metafile = await thunkAPI.dispatch(fetchMetafile({ path: input.path })).unwrap();
    if (metafile) {
      thunkAPI.dispatch(
        cardUpdated({
          ...card,
          name: metafile.name,
          type: metafile.handler,
          metafile: metafile.id
        })
      );
    }
  }
  return cardId;
});

/**
 * Remove a Card component from the Redux store and the UI.
 * @param card The UUID of the Card component to remove.
 */
export const removeCard = createAppAsyncThunk<void, { card: UUID }>(
  'cards/removeCard',
  async (input, thunkAPI) => {
    const card = cardSelectors.selectById(thunkAPI.getState(), input.card);
    const stacks = stackSelectors.selectEntities(thunkAPI.getState());
    const stack = card?.captured ? stacks[card?.captured] : undefined;

    if (stack && card) {
      thunkAPI.dispatch(
        stackUpdated({
          ...stack,
          cards: stack.cards.filter(c => c !== card.id)
        })
      );
      thunkAPI.dispatch(cardRemoved(card.id));
    } else if (card) {
      thunkAPI.dispatch(cardRemoved(card.id));
    }
  }
);
