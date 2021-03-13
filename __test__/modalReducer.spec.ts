import type { Modal } from '../src/types';
import { modalReducer } from '../src/store/reducers/modal';
import { ActionKeys } from '../src/store/actions';

describe('modalReducer', () => {
  const modals: { [id: string]: Modal } = {
    '92': {
      id: '92',
      type: 'Error',
      subtype: 'RepositoryMissingError',
      target: '23',
      options: { message: 'Repository missing for metafile \'sampleUser/myRepo\'' }
    }
  }

  const newModal: Modal = {
    id: '94',
    type: 'Error',
    subtype: 'HandlerMissingError',
    target: '19',
    options: { message: 'Metafile \'sampleUser/myRepo\' missing handler to resolve filetype: \'TypeScript\'' }
  }

  it('modalReducer returns default state when current state is blank', () => {
    const newModals = modalReducer(undefined, { type: ActionKeys.ADD_MODAL, id: newModal.id, modal: newModal });
    expect(Object.keys(newModals)).toHaveLength(1);
    expect(newModals).toMatchSnapshot();
  });

  it('modalReducer appends a new modal to state on action ADD_ERROR', () => {
    const addedModals = modalReducer(modals, { type: ActionKeys.ADD_MODAL, id: newModal.id, modal: newModal });
    expect(Object.keys(addedModals)).toHaveLength(2);
    expect(addedModals).toMatchSnapshot();
  });

  it('modalReducer removes an modal from state on action REMOVE_ERROR', () => {
    const matchedModals = modalReducer(modals, { type: ActionKeys.REMOVE_MODAL, id: '92' });
    expect(Object.keys(matchedModals)).toHaveLength(0);
  });

  it('modalReducer resolves non-matching modal in state on action REMOVE_ERROR', () => {
    const nonMatchedModals = modalReducer(modals, { type: ActionKeys.REMOVE_MODAL, id: newModal.id });
    expect(Object.keys(nonMatchedModals)).toHaveLength(Object.keys(modals).length);
  });

});