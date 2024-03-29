import {isDefined} from '#preload';
import {createEntityAdapter, createSlice} from '@reduxjs/toolkit';
import type {
  CommitDialog,
  DeleteBranchDialog,
  DeleteFileDialog,
  GitGraph,
  MergeDialog,
  Modal,
  NewBranchDialog,
  Notification,
  RevertCommitDialog,
} from '@syn-types/modal';

export const modalAdapter = createEntityAdapter<Modal>();

export const modalSlice = createSlice({
  name: 'modals',
  initialState: modalAdapter.getInitialState(),
  reducers: {
    modalAdded: modalAdapter.addOne,
    modalRemoved: modalAdapter.removeOne,
  },
});

export const isGitGraphModal = (modal: Modal | undefined): modal is GitGraph =>
  isDefined(modal) && modal.type === 'GitGraph';

export const isCommitDialogModal = (modal: Modal | undefined): modal is CommitDialog =>
  isDefined(modal) && modal.type === 'CommitDialog';

export const isMergeDialogModal = (modal: Modal | undefined): modal is MergeDialog =>
  isDefined(modal) && modal.type === 'MergeDialog';

export const isNewBranchDialog = (modal: Modal | undefined): modal is NewBranchDialog =>
  isDefined(modal) && modal.type === 'NewBranchDialog';

export const isDeleteBranchDialog = (modal: Modal | undefined): modal is DeleteBranchDialog =>
  isDefined(modal) && modal.type === 'DeleteBranchDialog';

export const isDeleteFileDialog = (modal: Modal | undefined): modal is DeleteFileDialog =>
  isDefined(modal) && modal.type === 'DeleteFileDialog';

export const isNotification = (modal: Modal | undefined): modal is Notification =>
  isDefined(modal) && modal.type === 'Notification';

export const isRevertCommitDialog = (modal: Modal | undefined): modal is RevertCommitDialog =>
  isDefined(modal) && modal.type === 'RevertCommitDialog';

export const {modalAdded, modalRemoved} = modalSlice.actions;

export default modalSlice.reducer;
