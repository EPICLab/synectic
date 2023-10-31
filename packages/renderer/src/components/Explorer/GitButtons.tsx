import {Add, Remove} from '@mui/icons-material';
import {IconButton, Tooltip, type IconButtonProps} from '@mui/material';
import type {Metafile} from '@syn-types/metafile';
import {useAppDispatch} from '../../store/hooks';
import {stageMetafile, unstageMetafile} from '../../store/thunks/metafiles';

export const StageButton = ({
  metafile,
  buttonColor,
  tooltip,
  disabled,
  ...props
}: {metafile: Metafile; buttonColor: string | undefined; tooltip?: string} & IconButtonProps) => {
  const dispatch = useAppDispatch();

  return disabled ? undefined : (
    <Tooltip title={tooltip}>
      <IconButton
        edge="start"
        aria-label="add-in-directory"
        size="small"
        sx={{
          cursor: 'pointer',
          mr: 0.25,
          aspectRatio: '1/1',
          height: 20,
          '& .MuiSvgIcon-root': {height: '0.75em'},
          color: buttonColor,
        }}
        onClick={async e => {
          e.stopPropagation();
          await dispatch(stageMetafile(metafile.id));
        }}
        {...props}
      >
        <Add />
      </IconButton>
    </Tooltip>
  );
};

export const UnstageButton = ({
  metafile,
  buttonColor,
  tooltip,
  disabled,
  ...props
}: {metafile: Metafile; buttonColor: string | undefined; tooltip?: string} & IconButtonProps) => {
  const dispatch = useAppDispatch();

  return disabled ? undefined : (
    <Tooltip title={tooltip}>
      <IconButton
        edge="start"
        aria-label="add-in-directory"
        size="small"
        sx={{
          cursor: 'pointer',
          mr: 0.25,
          aspectRatio: '1/1',
          height: 20,
          '& .MuiSvgIcon-root': {height: '0.75em'},
          color: buttonColor,
        }}
        onClick={async e => {
          e.stopPropagation();
          await dispatch(unstageMetafile(metafile.id));
        }}
        {...props}
      >
        <Remove />
      </IconButton>
    </Tooltip>
  );
};
