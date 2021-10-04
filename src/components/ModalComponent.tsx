import React from 'react';

import type { Modal } from '../types';
import CloneDialog from './CloneDialog';
import DiffPickerDialog from './DiffPickerDialog';
import ErrorDialog from './ErrorDialog';
import { GitGraph } from './GitGraph';
import MergeDialog from './MergeDialog';
import NewCardDialog from './NewCardDialog';
import SourcePickerDialog from './SourcePickerDialog';

const ModalComponent: React.FunctionComponent<Modal> = props => {
  switch (props.type) {
    case 'DiffPicker':
      return (<DiffPickerDialog {...props} />);
    case 'CloneSelector':
      return (<CloneDialog {...props} />);
    case 'Error':
      return (<ErrorDialog {...props} />);
    case 'GitGraph':
      return props.target ? (<GitGraph repo={props.target} />) : null;
    case 'MergeSelector':
      return (<MergeDialog {...props} />)
    case 'NewCardDialog':
      return (<NewCardDialog {...props} />);
    case 'SourcePicker':
      return (<SourcePickerDialog {...props} />);
    default:
      return null;
  }
};

export default ModalComponent;