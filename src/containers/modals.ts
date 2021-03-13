import { v4 } from 'uuid';

import type { Modal, ModalType, UUID } from '../types';
import { ActionKeys, NarrowActionType } from '../store/actions';

type AddModalAction = NarrowActionType<ActionKeys.ADD_MODAL>

export const addModal = ({ type, subtype, target, options }: {
  type: ModalType,
  subtype?: string,
  target?: UUID,
  options?: { [key: string]: (string | number | boolean) }
}): AddModalAction => {
  const modal: Modal = {
    id: v4(),
    type: type,
    subtype: subtype,
    target: target,
    options: options
  };
  return {
    type: ActionKeys.ADD_MODAL,
    id: modal.id,
    modal: modal
  };
}