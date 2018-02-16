  import 'jquery-ui';
  import 'jquery-ui/ui/widgets/draggable';
  import 'jquery-ui/ui/widgets/droppable';
  import 'jquery-ui/ui/widgets/selectable';

export enum State {
  enable = 'enable',
  disable = 'disable'
}

export interface Draggable {
  draggable(opt: State): void;
}

export interface Droppable {
  droppable(opt: State): void;
}

export interface Selectable {
  selectable(opt: State): void;
}
