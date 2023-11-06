import type {Modal} from '@syn-types/modal';
import GitGraph from '../GitGraph';
import CommitDialog from './CommitDialog';
import DeleteBranchDialog from './DeleteBranchDialog';
import DeleteFileDialog from './DeleteFileDialog';
import MergeDialog from './MergeDialog';
import NewBranchDialog from './NewBranchDialog';
import NewCardDialog from './NewCardDialog';
import Notification from './Notification';
import RevertCommitDialog from './RevertCommitDialog';
import {
  isCommitDialogModal,
  isDeleteBranchDialog,
  isDeleteFileDialog,
  isGitGraphModal,
  isMergeDialogModal,
  isNewBranchDialog,
  isNotification,
  isRevertCommitDialog,
} from '/@/store/slices/modals';

const ModalComponent = (props: Modal) => {
  switch (props.type) {
    // case 'CloneSelector':
    //   return (<CloneDialog {...props} />);
    case 'GitGraph':
      return isGitGraphModal(props) ? <GitGraph repo={props.repo} /> : null;
    case 'CommitDialog':
      return isCommitDialogModal(props) ? <CommitDialog modal={props} /> : null;
    case 'MergeDialog':
      return isMergeDialogModal(props) ? <MergeDialog modal={props} /> : null;
    case 'NewBranchDialog':
      return isNewBranchDialog(props) ? <NewBranchDialog modal={props} /> : null;
    case 'DeleteBranchDialog':
      return isDeleteBranchDialog(props) ? <DeleteBranchDialog modal={props} /> : null;
    case 'DeleteFileDialog':
      return isDeleteFileDialog(props) ? <DeleteFileDialog modal={props} /> : null;
    case 'NewCardDialog':
      // no specific fields required for `NewCardDialog`, so no type predicate is needed
      return <NewCardDialog modal={props} />;
    case 'Notification':
      return isNotification(props) ? <Notification {...props} /> : null;
    case 'RevertCommitDialog':
      return isRevertCommitDialog(props) ? <RevertCommitDialog modal={props} /> : null;
    default: {
      console.error(`No Modal component found for ${props.type}`);
      return null;
    }
  }
};

export default ModalComponent;
