import { RootState } from '../store';
import { modalAdapter } from '../slices/modals';
import { createSelector } from '@reduxjs/toolkit';
import { ModalType } from '../types';

export const selectors = modalAdapter.getSelectors<RootState>(state => state.modals);

const selectByType = createSelector(
    selectors.selectAll,
    (_state: RootState, type: ModalType) => type,
    (modals, type) => modals.filter(m => m.type === type)
)

const modalSelectors = { ...selectors, selectByType };

export default modalSelectors;