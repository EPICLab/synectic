import {IconButton, type IconButtonProps} from '@mui/material';
import {DragIndicator} from '@mui/icons-material';

const Handle = ({draggable = false, ...props}: {draggable?: boolean} & IconButtonProps) => {
  return (
    <IconButton
      edge="start"
      aria-label="drag-handle"
      size="small"
      sx={{
        cursor: 'grab',
        mr: 0.25,
        aspectRatio: '1/1',
        height: 40,
        '& .MuiSvgIcon-root': {height: '0.75em'},
        color: 'rgba(0, 0, 0, 0.54)',
      }}
      onDoubleClick={() => console.log(`draggable: ${draggable}`)}
      {...props}
    >
      <DragIndicator />
    </IconButton>
  );
};

export default Handle;
