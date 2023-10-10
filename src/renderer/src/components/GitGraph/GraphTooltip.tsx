import { Card, CardContent, Typography, styled } from '@mui/material';

type Placement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'left-start'
  | 'left'
  | 'left-end'
  | 'right-start'
  | 'right'
  | 'right-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end';

type Position = { top: number; left: number };

// Mapped object type for converting Placement into `top` and `left` position presets
type PlacementPosition = {
  [key in Placement]: { top: number; left: number };
};

const placementToPosition: PlacementPosition = {
  'top-start': { top: -15, left: -5 },
  top: { top: -15, left: 0 },
  'top-end': { top: -15, left: 5 },
  'left-start': { top: -5, left: -15 },
  left: { top: 0, left: -15 },
  'left-end': { top: 5, left: -15 },
  'right-start': { top: -5, left: 15 },
  right: { top: 0, left: 15 },
  'right-end': { top: 5, left: 15 },
  'bottom-start': { top: 15, left: -5 },
  bottom: { top: 15, left: 0 },
  'bottom-end': { top: 15, left: 5 }
};

const GraphTooltip = (props: { disabled?: boolean; content: string; placement: Placement }) => {
  const position = placementToPosition[props.placement];

  return props.disabled ? undefined : (
    <StyledTag position={position}>
      <CardContent sx={{ padding: '0 !important' }}>
        <StyledTypography>{props.content.replace(/\\n/g, '<br />')}</StyledTypography>
      </CardContent>
    </StyledTag>
  );
};

const StyledTag = styled(Card, { shouldForwardProp: prop => prop !== 'position' })<{
  position: Position;
}>(({ position, theme }) => ({
  backgroundColor: theme.palette.common.white,
  height: 'max-content',
  width: 'max-content',
  position: 'absolute',
  top: position.top,
  left: position.left,
  boxShadow: theme.shadows[1],
  borderRadius: '2px',
  border: '0px',
  padding: '1px 2px',
  zIndex: theme.zIndex.modal
}));

const StyledTypography = styled(Typography)(() => ({
  fontSize: 6,
  fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
  color: 'rgba(0, 0, 0, 0.87)',
  whiteSpace: 'pre-wrap'
}));

export default GraphTooltip;
