import { Code, ErrorOutline, Public } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import { ChangeEvent, KeyboardEvent, MouseEvent, useState } from 'react';
import type { CardType } from 'types/app';
import type { Modal } from 'types/modal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import filetypeSelectors from '../../store/selectors/filetypes';
import { modalRemoved } from '../../store/slices/modals';
import { createCard } from '../../store/thunks/cards';
import { createMetafile } from '../../store/thunks/metafiles';

const isDefined = window.api.utils.isDefined;
const extractExtension = window.api.fs.extractExtension;
const replaceExt = window.api.fs.replaceExt;

const NewCardDialog = ({ props }: { props: Modal }) => {
  const filetypes = useAppSelector(state => filetypeSelectors.selectAll(state));
  const [category, setCategory] = useState<CardType | undefined>('Editor');
  const [fileName, setFileName] = useState('');
  const [filetype, setFiletype] = useState('');
  const [validated, setValidated] = useState<boolean | undefined>();
  const dispatch = useAppDispatch();

  const handleClose = () => dispatch(modalRemoved(props.id));

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  };

  const handleCategoryChange = (_event: MouseEvent<HTMLElement>, newCategory: string) => {
    setCategory(newCategory as CardType | undefined);
  };

  const handleFileNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);

    const currentExtension =
      event.target.value.indexOf('.') !== -1 ? extractExtension(event.target.value) : '';
    const updatedExtension = filetypes.find(filetype =>
      filetype.extensions.find(ext => currentExtension === ext || '.' + currentExtension === ext)
    );

    if (updatedExtension) {
      setFiletype(updatedExtension.filetype);
      setValidated(true);
    } else {
      setFiletype('');
      setValidated(false);
    }
  };

  const handleFiletypeChange = (event: SelectChangeEvent<string>) => {
    setFiletype(event.target.value);

    const updatedFiletype = filetypes.find(filetype => filetype.filetype === event.target.value);
    if (!updatedFiletype) return;

    const updatedFilename = replaceExt(fileName, updatedFiletype);
    setFileName(updatedFilename);
  };

  const handleClick = async () => {
    if (category === 'Editor') {
      const metafile = await dispatch(
        createMetafile({
          metafile: {
            name: fileName,
            handler: 'Editor',
            filetype: filetype,
            content: ''
          }
        })
      ).unwrap();
      dispatch(createCard({ metafile: metafile }));
    }
    handleClose();
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      aria-labelledby="new-card-dialog-title"
      aria-describedby="new-card-dialog-description"
    >
      <DialogTitle id="new-card-dialog-title">New Card</DialogTitle>
      <DialogContent sx={{ px: 2, pb: 1.5 }}>
        <DialogContentText id="new-dialog-description">
          Select the type of card and enter required data.
        </DialogContentText>
        <ToggleButtonGroup
          id="category"
          aria-label="new-card-category"
          size="small"
          sx={{ m: 1 }}
          value={category}
          exclusive
          onChange={handleCategoryChange}
        >
          <ToggleButton value="Editor">
            <Code sx={{ mr: 1 }} />
            Editor
          </ToggleButton>
          <ToggleButton value="Browser">
            <Public sx={{ mr: 1 }} />
            Browser
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ width: '100%' }}>
          <FormControl data-testid="new-card-filename-form" variant="outlined" sx={{ m: 1 }}>
            <OutlinedInput
              id="new-card-filename"
              size="small"
              sx={{ width: 203 }}
              value={fileName}
              onChange={handleFileNameChange}
              onKeyDown={e => handleKeyDown(e)}
              disabled={category !== 'Editor'}
              error={validated === false}
              endAdornment={
                validated === false ? (
                  <InputAdornment position="end">
                    <Tooltip title="Incorrect Filetype">
                      <ErrorOutline sx={{ color: 'rgb(211, 47, 47)' }} />
                    </Tooltip>
                  </InputAdornment>
                ) : null
              }
            />
            <FormHelperText>Filename</FormHelperText>
          </FormControl>
          <FormControl
            data-testid="new-card-filetype-form"
            variant="outlined"
            sx={{ mr: 1, my: 1 }}
          >
            <Select
              id="new-card-filetype"
              size="small"
              sx={{ width: 185 }}
              disabled={category !== 'Editor'}
              value={filetype}
              onChange={handleFiletypeChange}
            >
              {filetypes.map(filetype => (
                <MenuItem key={filetype.id} value={filetype.filetype}>
                  {filetype.filetype}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Filetype</FormHelperText>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button id="cancel-button" variant="contained" onClick={() => handleClose()}>
          Cancel
        </Button>
        <Button
          id="create-card-button"
          variant="contained"
          disabled={!isDefined(validated) || validated === false}
          onClick={() => handleClick()}
        >
          Create Card
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewCardDialog;
