export interface Base<T,U> {
  readonly uuid: string;
  readonly created: number;
  modified: number;
  element: HTMLDivElement;
  parent: T;
  children: U[];
}
