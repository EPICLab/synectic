import type { Timestamp, UUID } from './app';

/** A stack representation containing cards grouped according to the user. */
export type Stack = {
  /** The unique ID for Stack object. */
  readonly id: UUID;
  /** The name of stack. */
  readonly name: string;
  /** The timestamp when stack was created. */
  readonly created: Timestamp;
  /** The timestamp for last update to stack properties. */
  readonly modified: Timestamp;
  /** An array with all Card object unique IDs contained in stack. */
  readonly cards: UUID[];
  /** The horizontal position of stack relative to parent object. */
  readonly x: number;
  /** The vertical position of stack relative to parent object. */
  readonly y: number;
};
