import React, { useState } from 'react';
import TreeItem, { TreeItemProps } from '@material-ui/lab/TreeItem';
import { createStyles, makeStyles, Theme, Typography } from '@material-ui/core';
import { SvgIconProps } from '@material-ui/core/SvgIcon';

declare module 'csstype' {
  interface Properties {
    '--tree-view-color'?: string;
    '--tree-view-bg-color'?: string;
  }
}

type StyledTreeItemProps = TreeItemProps & {
  bgColor?: string;
  color?: string;
  labelIcon: React.ElementType<SvgIconProps>;
  labelInfo?: React.ElementType<SvgIconProps>;
  labelText: string;
  labelInfoClickHandler?: (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
};

export const useTreeItemStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      color: theme.palette.text.secondary,
      '&:hover > $content': {
        backgroundColor: theme.palette.action.hover,
      },
      '&:focus > $content, &$selected > $content': {
        backgroundColor: `var(--tree-view-bg-color, ${theme.palette.grey[400]})`,
        color: 'var(--tree-view-color)',
      },
      '&:focus > $content $label, &:hover > $content $label, &$selected > $content $label': {
        backgroundColor: 'transparent',
      }
    },
    content: {
      color: theme.palette.text.secondary,
      borderTopRightRadius: theme.spacing(2),
      borderBottomRightRadius: theme.spacing(2),
      paddingRight: theme.spacing(1),
      fontWeight: theme.typography.fontWeightMedium,
      '$expanded > &': {
        fontWeight: theme.typography.fontWeightRegular,
      },
    },
    group: {
      marginLeft: 0,
      '& $content': {
        paddingLeft: theme.spacing(2)
      },
    },
    expanded: {},
    selected: {},
    label: {
      fontWeight: 'inherit',
      color: 'inherit',
    },
    labelRoot: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0.5, 0),
    },
    labelIcon: {
      marginRight: theme.spacing(1),
    },
    labelText: {
      fontWeight: 'inherit',
      flexGrow: 1
    },
    labelInfo: {
      fontWeight: 'inherit',
      fontSize: 16,
      marginRight: theme.spacing(1)
    }
  })
);

export const StyledTreeItem: React.FunctionComponent<StyledTreeItemProps> = props => {
  const { labelText, labelIcon: LabelIcon, labelInfo: LabelInfo, labelInfoClickHandler, color, bgColor, ...other } = props;
  const [hover, setHover] = useState(false);
  const classes = useTreeItemStyles();

  return (
    <TreeItem
      label={
        <div className={classes.labelRoot}>
          <LabelIcon color='inherit' className={classes.labelIcon} style={{ color: color }} />
          <Typography variant='body2' className={classes.labelText} style={{ color: color }} >
            {labelText}
          </Typography>
          {(LabelInfo && labelInfoClickHandler && hover)
            ? <LabelInfo color='inherit' className={classes.labelInfo} onClick={labelInfoClickHandler} style={{ color: color }} />
            : null}
        </div>
      }
      style={{
        '--tree-view-color': color,
        '--tree-view-bg-color': bgColor,
      }}
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      classes={{
        root: classes.root,
        content: classes.content,
        expanded: classes.expanded,
        selected: classes.selected,
        group: classes.group,
        label: classes.label,
      }}
      {...other}
    />
  )
}