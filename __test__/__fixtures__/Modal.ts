import type { Modal } from '../../src/types';

// Note: All UUIDs are unique and were generated to pass 'validator/lib/isUUID'

export const newCardModal: Modal = {
  id: '97fa02bc-596c-46d6-b025-2968f0d32b91',
  type: 'NewCardDialog'
}

export const diffPickerModal: Modal = {
  id: '2d52bbae-d396-44a5-a91d-ec4cf3ab8a9b',
  type: 'DiffPicker'
}

export const branchListModal: Modal = {
  id: '8650d074-70b5-4eaa-a99e-a4f5eb825a60',
  type: 'BranchList'
}

export const mergeSelectorModal: Modal = {
  id: '766d01f2-d4f5-4d13-99c0-6e1eba396079',
  type: 'MergeSelector'
}

export const errorModal: Modal = {
  id: '67f53785-4b14-46a8-8ffb-8fe0cad89bbd',
  type: 'Error',
  subtype: 'LoadError',
  target: '13',
  options: { message: 'Failed to load file.' }
}