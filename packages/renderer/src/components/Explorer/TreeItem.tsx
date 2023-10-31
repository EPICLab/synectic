import {removeNullableProperties} from '#preload';
import {Box, Tooltip, Typography, styled, tooltipClasses, type TooltipProps} from '@mui/material';
import {TreeItem, treeItemClasses, type TreeItemProps} from '@mui/x-tree-view';
import React, {type ReactNode} from 'react';

declare module 'react' {
  interface CSSProperties {
    '--tree-view-color'?: string;
    '--tree-view-bg-color'?: string;
  }
}

export const StyledTreeItem = (props: StyledTreeItemProps) => {
  const {bgColor, color, labelText, hoverText, labelInfo, labelButton, ...other} = props;

  return (
    <StyledTreeItemRoot
      label={
        <Box sx={{display: 'flex', alignItems: 'center', p: 0.5, pr: 0}}>
          <HoverTextLabel
            hoverText={hoverText}
            color={color}
          >
            <Typography
              variant="body2"
              sx={{fontWeight: 'inherit', flexGrow: 1}}
            >
              {labelText}
            </Typography>
          </HoverTextLabel>
          <Typography
            variant="caption"
            color="inherit"
          >
            {labelInfo}
          </Typography>
          {labelButton}
        </Box>
      }
      style={{
        ...removeNullableProperties({
          '--tree-view-color': color,
          '--tree-view-bg-color': bgColor,
        }),
      }}
      {...other}
    />
  );
};

type StyledTreeItemProps = TreeItemProps & {
  bgColor?: string | undefined;
  color?: string | undefined;
  labelText: string;
  hoverText?: string | undefined;
  labelInfo?: string;
  labelButton?: ReactNode;
};

export const StyledTreeItemRoot = styled(TreeItem)(({theme}) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: `var(--tree-view-color, ${theme.palette.text.secondary})`,
    paddingRight: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
    '&:hover, &.Mui-expanded:hover, &.Mui-selected:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-expanded': {},
    '&.Mui-selected': {
      backgroundColor: 'unset',
    },
    '&.Mui-focused, &.Mui-selected.Mui-focused': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.hover})`,
      color: `var(--tree-view-color, ${theme.palette.text.secondary})`,
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: 'inherit',
      color: 'inherit',
    },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 7,
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: theme.spacing(2),
    },
  },
}));

const HoverTextLabel = ({
  hoverText,
  color,
  children,
}: {
  hoverText: string | undefined;
  color?: string | undefined;
  children: React.ReactElement<any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}) => {
  return hoverText ? (
    <StyledTooltip
      title={hoverText}
      placement="top"
      color={color}
    >
      {children}
    </StyledTooltip>
  ) : (
    children
  );
};

const StyledTooltip = styled(({className, ...props}: TooltipProps) => (
  <Tooltip
    {...props}
    classes={{popper: className}}
  />
))(({color}) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    color: color,
  },
}));
