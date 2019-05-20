import { Card } from '../lib/Card';
import { cardTypes } from '../../app/Types';
import * as io from '../fs/io';
import { Dialog } from '../lib/Dialog';

/**
 * Converts card type name to card instance on canvas.
 * @param handler The Card type name (use {@link app/Types.ts} for handler names).
 * @param filename A valid filename or path to associate with the new card.
 * @return Card instance corresponding to handler type or undefined if no handler defined.
 */
export function handlerToCard<T extends Card>(handler: string, filename: string): T | undefined {
  if (handler in cardTypes) {
    io.exists(filename).then(exist => {
      if (exist) {
        return new cardTypes[handler](global.Synectic.current, filename);
      } else {
        io.writeFileAsync(filename, '')
          .then(() => {
            return new cardTypes[handler](global.Synectic.current, filename);
          })
          .catch(error => new Dialog('snackbar', 'New Card Loading Error', error.message));
      }
    })
    .catch(error => new Dialog('snackbar', 'New Card Loading Error', error.message));
  }
  return undefined;
}
