import { withStyles } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';

export const StyledIconButton = withStyles({
  root: {
    color: '#ffffff',
    '&:hover': {
      color: '#d80027'
    }
  }
})(IconButton);