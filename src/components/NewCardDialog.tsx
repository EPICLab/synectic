import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@material-ui/core';

import type { CardType, Modal } from '../types';
import { RootState } from '../store/store';
import { loadCard } from '../containers/handlers';
import * as io from '../containers/io';
import { flattenArray } from '../containers/flatten';
import { getMetafile } from '../containers/metafiles';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { filetypeSelectors } from '../store/selectors/filetypes';
import { modalRemoved } from '../store/slices/modals';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 530,
      backgroundColor: theme.palette.background.paper,
    },
    formControl1: {
      margin: theme.spacing(1),
      minWidth: 496
    },
    formControl2: {
      margin: theme.spacing(1),
      minWidth: 240,
    },
    button: {
      margin: theme.spacing(1),
    },
    timeline: {
      margin: theme.spacing(1),
      '& > :last-child .MuiTimelineItem-content': {
        height: 28
      }
    },
    tl_item: {
      padding: theme.spacing(0, 2),
      '&:before': {
        flex: 0,
        padding: theme.spacing(0)
      }
    },
    tl_content: {
      padding: theme.spacing(0.5, 1, 0),
    },
    section1: {
      margin: theme.spacing(3, 2, 1),
    },
    section2: {
      margin: theme.spacing(1, 1),
    },
    section3: {
      margin: theme.spacing(1, 1),
    },
  }),
);

const NewCardDialog: React.FunctionComponent<Modal> = props => {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const filetypes = useAppSelector((state: RootState) => filetypeSelectors.selectAll(state));
  const exts: string[] = flattenArray(filetypes.map(filetype => filetype.extensions)); // List of all valid extensions found w/in filetypes
  // configExts is a list of all .config extensions found within exts:
  const configExts: string[] = flattenArray((filetypes.map(filetype =>
    filetype.extensions.filter(ext => ext.charAt(0) === '.'))).filter(arr => arr.length > 0));

  const [category, setCategory] = useState<CardType | undefined>(undefined);
  const [fileName, setFileName] = React.useState('');
  const [filetype, setFiletype] = React.useState('');
  const [isFileNameValid, setIsFileNameValid] = React.useState(false);
  const [isExtensionValid, setIsExtensionValid] = React.useState(false);

  useEffect(() => {
    setCategory(undefined);
    setFileName('');
    setFiletype('');
    setIsExtensionValid(false);
    setIsFileNameValid(false);
  }, []);

  const isCreateReady = () => {
    if (category === 'Editor') return (isFileNameValid && isExtensionValid && filetype !== '' && fileName.indexOf('.') !== -1);
    if (category === 'Browser') return true;
    else return false;
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  }

  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);
    // currExt takes the current extension found within the filename, or is an empty string if no extension is found
    const currExt = event.target.value.indexOf('.') !== -1 ? io.extractExtension(event.target.value) : '';
    // newExt matches currExt to an existing extension within filetypes. If none is found, it returns undefined
    const newExt = filetypes.find(filetype => filetype.extensions.find(extension => currExt === extension || '.' + currExt === extension));

    if (newExt) { // If a valid filetype extension was matched, then set the file type
      setFiletype(newExt.filetype);
      setIsExtensionValid(true);
    } else { // Otherwise, the extension is not valid
      setIsExtensionValid(false);
    }

    io.validateFileName(event.target.value, configExts, exts) ? setIsFileNameValid(true) : setIsFileNameValid(false);
  };

  const handleFiletypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFiletype(event.target.value as string);

    // Match with a valid filetype
    const newFiletype = filetypes.find(filetype => filetype.filetype === event.target.value as string);
    // If no matches were found, return (forces typeof newFiletype to be Filetype and not undefined) 
    if (!newFiletype) return;

    // Update the current file name with the new selected filetype's extension
    const currFileName = io.replaceExt(fileName, newFiletype);
    setFileName(currFileName);

    if (io.validateFileName(currFileName, configExts, exts)) {
      setIsFileNameValid(true);
      setIsExtensionValid(true);
    } else {
      setIsFileNameValid(false);
    }
  };

  const handleClose = () => dispatch(modalRemoved(props.id));

  const handleClick = async () => {
    if (category === 'Editor' && isFileNameValid && filetype !== '' && fileName.indexOf('.') !== -1 && isExtensionValid) {
      const metafile = await dispatch(getMetafile({ virtual: { name: fileName, handler: 'Editor', filetype: filetype } })).unwrap();
      if (metafile) await dispatch(loadCard({ metafile: metafile }));
      handleClose();
    }
    if (category === 'Browser') {
      const metafile = await dispatch(getMetafile({ virtual: { name: 'Browser', handler: 'Browser' } })).unwrap();
      if (metafile) dispatch(loadCard({ metafile: metafile }));
      handleClose();
    }
  };

  return (
    <Dialog id='new-card-dialog' data-testid='new-card-dialog' open={true} onClose={handleClose} aria-labelledby='new-card-dialog'>
      <div className={classes.root}>
        <div className={classes.section1}>
          <Grid container alignItems='center'>
            <Grid item xs>
              <Typography gutterBottom variant='h4'>
                New Card
              </Typography>
            </Grid>
            <Grid item>
            </Grid>
          </Grid>
          <Typography color='textSecondary' variant='body2'>
            Select the card category and any required subfields to create a card.
          </Typography>
        </div>
        <Divider variant='middle' />
        <div className={classes.section2}>
          <Button className={classes.button} data-testid='editor-button' variant={category === 'Editor' ? 'contained' : 'outlined'}
            color='primary' onClick={() => setCategory('Editor')}>Editor</Button>
          <Button className={classes.button} data-testid='browser-button' variant={category === 'Browser' ? 'contained' : 'outlined'}
            color='primary' onClick={() => setCategory('Browser')}>Browser</Button>
        </div>
        {category === 'Editor' ?
          <div className={classes.section2}>
            <TextField
              id='new-card-file-name'
              variant='outlined'
              className={classes.formControl2}
              label='Filename'
              value={fileName}
              onChange={handleFileNameChange}
              onKeyDown={(e) => handleKeyDown(e)}
              disabled={category !== 'Editor'}
              error={fileName.length > 0 && !isFileNameValid}
              helperText={(fileName.length > 0 && !isFileNameValid) ? 'Invalid Filename' : ''}
            />
            <FormControl data-testid='new-card-filetype-form' variant='outlined' className={classes.formControl2}>
              <InputLabel htmlFor={'new-card-filetype-selector'} >Filetype</InputLabel>
              <Select
                id='new-card-filetype-selector'
                aria-label='new-card-filetype-selector'
                inputProps={{ 'data-testid': 'new-card-filetype-selector' }}
                disabled={category !== 'Editor'}
                value={filetype}
                onChange={handleFiletypeChange}
                label='Filetype'
              >
                {filetypes.map(filetype => <MenuItem key={filetype.id} value={filetype.filetype}>{filetype.filetype}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
          : null}
        <div className={classes.section3}>
          <Button id='create-card-button'
            className={classes.button}
            data-testid='create-card-button'
            variant='outlined'
            color='primary'
            disabled={!isCreateReady()}
            onClick={() => handleClick()}
          >Create Card</Button>
        </div>
      </div>
    </Dialog>
  );
};

export default NewCardDialog;