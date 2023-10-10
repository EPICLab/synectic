import type { Modal } from 'types/modal';
import {
  isCommitDialogModal,
  isDeleteBranchDialog,
  isGitGraphModal,
  isMergeDialogModal,
  isNewBranchDialog,
  isNotification,
  isRevertCommitDialog
} from '../../store/slices/modals';
import CommitDialog from './CommitDialog';
import DeleteBranchDialog from './DeleteBranchDialog';
import MergeDialog from './MergeDialog';
import NewBranchDialog from './NewBranchDialog';
import NewCardDialog from './NewCardDialog';
import Notification from './Notification';
import RevertCommitDialog from './RevertCommitDialog';
import GitGraph from '../GitGraph';

const ModalComponent = (props: Modal) => {
  switch (props.type) {
    // case 'CloneSelector':
    //   return (<CloneDialog {...props} />);
    case 'GitGraph':
      return isGitGraphModal(props) ? <GitGraph repo={props.repo} /> : null;
    case 'CommitDialog':
      return isCommitDialogModal(props) ? <CommitDialog props={props} /> : null;
    case 'MergeDialog':
      return isMergeDialogModal(props) ? <MergeDialog props={props} /> : null;
    case 'NewBranchDialog':
      return isNewBranchDialog(props) ? <NewBranchDialog {...props} /> : null;
    case 'DeleteBranchDialog':
      return isDeleteBranchDialog(props) ? <DeleteBranchDialog {...props} /> : null;
    case 'NewCardDialog':
      // no specific fields required for `NewCardDialog`, so just using Modal props
      return <NewCardDialog props={props} />;
    case 'Notification':
      return isNotification(props) ? <Notification {...props} /> : null;
    case 'RevertCommitDialog':
      return isRevertCommitDialog(props) ? <RevertCommitDialog {...props} /> : null;
    default: {
      console.error(`No Modal component found for ${props.type}`);
      return null;
    }
  }
};

export default ModalComponent;
