import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

type LoadState = {
  loading: boolean;
}

export const Spinner: React.FunctionComponent<LoadState> = (props: LoadState) => {
  return <React.Fragment>
    {props.loading && <CircularProgress variant='indeterminate' size={20} />}
  </React.Fragment>;
}