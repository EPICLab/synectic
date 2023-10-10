import type { CardType, Timestamp, UUID } from './app';

/** A card representation containing actionable content (e.g. editor, explorer, browser). */
export type Card = {
  /** The UUID for Card object. */
  readonly id: UUID;
  /** The name of card. */
  readonly name: string;
  /** The type of card. */
  readonly type: CardType;
  /** The UUID for related Metafile object. */
  readonly metafile: UUID;
  /** The timestamp when card was created. */
  readonly created: Timestamp;
  /** The timestamp for last update to card properties. */
  readonly modified: Timestamp;
  /** The UUID for capturing Stack object, or undefined if not captured. */
  readonly captured: UUID | undefined;
  /** Indicator for whether the card is expanded to fullscreen mode. */
  readonly expanded: boolean;
  /** Indicator for whether the card is flipped to the reverse side. */
  readonly flipped: boolean;
  /**
   * Indicator for whether the content is currently loading; provides a progress indicator value
   * between 0 and 100 when loading, and `undefined` if loaded.
   */
  readonly loading: number | undefined;
  /** The horizontal position of card relative to parent object. */
  readonly x: number;
  /** The vertical position of card relative to parent object. */
  readonly y: number;
};
