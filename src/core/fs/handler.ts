import { Card } from '../lib/Card';
import { cardTypes } from '../../app/Types';
import { banner } from './notifications';

/**
 * Converts card type name to card instance on canvas.
 * @param handler The Card type name (use {@link app/Types.ts} for handler names).
 * @param filename A valid filename or path to associate with the new card.
 * @return Card instance corresponding to handler type or null if no handler defined.
 */
export function handlerToCard<T extends Card>(handler: string, filename?: string): T | null {
  if (handler in cardTypes) return new cardTypes[handler](global.Synectic.current, filename);
  else {
    let message: string = 'Type handler `' + handler + '` is not a configured card type. Verify card types in app/Types.ts file.';
    banner(global.Synectic.current, message, 'Typer Handler Configuration Error');
    return null;
  }
}
