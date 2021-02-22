import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PathLike } from 'fs-extra';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem, { TreeItemProps } from '@material-ui/lab/TreeItem';
import { createStyles, makeStyles, Theme, Typography } from '@material-ui/core';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import { SvgIconProps } from '@material-ui/core/SvgIcon';

import type { UUID, Card } from '../types';
import { RootState } from '../store/root';
import { loadCard } from '../containers/handlers';
import { extractFilename } from '../containers/io';
import { useDirectory } from '../store/hooks/useDirectory';

const useStyles = makeStyles({
  root: {
    transform: 'translateY(-12px)',
  }
});

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
  labelInfo?: string;
  labelText: string;
};

const useTreeItemStyles = makeStyles((theme: Theme) =>
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
    }
  })
);

const StyledTreeItem = (props: StyledTreeItemProps) => {
  const classes = useTreeItemStyles();
  const { labelText, labelIcon: LabelIcon, labelInfo, color, bgColor, ...other } = props;

  return (
    <TreeItem
      label={
        <div className={classes.labelRoot}>
          <LabelIcon color='inherit' className={classes.labelIcon} />
          <Typography variant='body2' className={classes.labelText}>
            {labelText}
          </Typography>
          <Typography variant='caption' color='inherit'>
            {labelInfo}
          </Typography>
        </div>
      }
      style={{
        '--tree-view-color': color,
        '--tree-view-bg-color': bgColor,
      }}
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

export const DirectoryComponent: React.FunctionComponent<{ root: PathLike }> = props => {
  const { directories, files, fetch } = useDirectory(props.root);
  const [expanded, setExpanded] = useState(false);
  const dispatch = useDispatch();

  const clickHandle = () => {
    if (!expanded) fetch();
    setExpanded(!expanded);
  }

  return (
    <StyledTreeItem key={props.root.toString()} nodeId={props.root.toString()}
      labelText={extractFilename(props.root)}
      labelIcon={expanded ? FolderOpenIcon : FolderIcon}
      onClick={clickHandle}
    >
      { directories.map(dir => <DirectoryComponent key={dir} root={dir} />)}
      { files?.map(file =>
        <StyledTreeItem key={file} nodeId={file}
          labelText={extractFilename(file)}
          labelIcon={InsertDriveFileIcon}
          onClick={() => dispatch(loadCard({ filepath: file }))}
        />
      )}
    </StyledTreeItem>
  );
};

const Explorer: React.FunctionComponent<{ rootId: UUID }> = props => {
  const rootMetafile = useSelector((state: RootState) => state.metafiles[props.rootId]);
  const { directories, files, fetch } = useDirectory(rootMetafile);
  const dispatch = useDispatch();
  const cssClasses = useStyles();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch() }, []); // initial async call to load/filter sub-directories & files via useDirectory hook

  return (
    <div className='file-explorer'>
      <div className='branch-ribbon-container'><p className='branch-ribbon-text'>{`Branch: ${rootMetafile.branch}`}</p></div>
      <TreeView
        classes={cssClasses}
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
        defaultEndIcon={<div style={{ width: 8 }} />}
      >
        {directories.map(dir => <DirectoryComponent key={dir} root={dir} />)}
        {files.map(file =>
          <StyledTreeItem key={file} nodeId={file}
            labelText={extractFilename(file)}
            labelIcon={InsertDriveFileIcon}
            onClick={() => dispatch(loadCard({ filepath: file }))}
          />
        )}
      </TreeView>
    </div>
  );
};

export const ExplorerReverse: React.FunctionComponent<Card> = props => {
  const metafile = useSelector((state: RootState) => state.metafiles[props.metafile]);
  const repos = useSelector((state: RootState) => state.repos);
  const [repo] = useState(metafile.repo ? repos[metafile.repo] : { name: 'Untracked' });

  return (
    <>
      <span>Name:</span><span className='field'>{props.name}</span>
      <span>Update:</span><span className='field'>{props.modified.toLocaleString()}</span>
      <span>Repo:</span><span className='field'>{repo.name}</span>
      <span>Branch:</span><span className='field'>{metafile.branch ? metafile.branch : 'untracked'}</span>
      <span>Status:</span><span className='field'>{metafile.status}</span>
    </>
  );
};

export default Explorer;