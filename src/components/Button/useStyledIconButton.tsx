import { makeStyles } from '@material-ui/core';

export type Mode = 'light' | 'dark';

export const useIconButtonStyle = makeStyles({
  root: {
    color: (props: { mode: Mode }) => props.mode === 'dark' ? '#59575a' : '#ffffff',
    '&:hover': {
      color: '#d80027'
    }
  }
})