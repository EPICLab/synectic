import React from 'react';

import type { Modal } from '../types';
import DiffPickerDialog from './DiffPickerDialog';
import ErrorDialog from './ErrorDialog';
import { GitGraph } from './GitGraph';
import MergeDialog from './MergeDialog';
import NewCardDialog from './NewCardDialog';

const ModalComponent: React.FunctionComponent<Modal> = props => {
  switch (props.type) {
    case 'NewCardDialog':
      return (<NewCardDialog {...props} />);
    case 'DiffPicker':
      return (<DiffPickerDialog {...props} />);
    case 'MergeSelector':
      return (<MergeDialog {...props} />)
    case 'Error':
      return (<ErrorDialog {...props} />);
    case 'GitGraph':
      return props.target ? (<GitGraph repo={props.target} />) : null;
    default:
      return null;
  }
};

export default ModalComponent;