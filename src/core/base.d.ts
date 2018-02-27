import { DateTime } from "luxon";

export interface Base<T,U> {
  readonly uuid: string;
  readonly created: DateTime;
  modified: DateTime;
  element: HTMLDivElement;
  parent: T;
  children: U[];
}
