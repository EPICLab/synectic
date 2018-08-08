import 'jquery-ui';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/droppable';
import 'jquery-ui/ui/widgets/selectable';

export enum OptionState {
  enable = 'enable',
  disable = 'disable'
}

export interface Draggable {
  draggable(opt: OptionState): void;
}

export interface Droppable {
  droppable(opt: OptionState): void;
}

export interface Selectable {
  selectable(opt: OptionState): void;
  contextMenu(): void;
}
