import { Description, Folder, FolderOpen } from '@mui/icons-material';
import { styled } from '@mui/material';
import { TreeView } from '@mui/x-tree-view';
import React, { useState } from 'react';
import type { UUID } from 'types/app';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import Directory from './Directory';
import File from './File';

const Explorer = ({ id }: { id: UUID }) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const directories = useAppSelector(state =>
    metafileSelectors.selectDirectories(state, metafile?.contains ?? [])
  );
  const files = useAppSelector(state =>
    metafileSelectors.selectFiles(state, metafile?.contains ?? [])
  );

  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (_event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (_event: React.SyntheticEvent, nodeIds: string | string[]) => {
    Array.isArray(nodeIds) ? setSelected(nodeIds) : setSelected([nodeIds]);
  };

  return (
    <>
      <TreeViewComponent
        aria-label="explorer"
        defaultCollapseIcon={<FolderOpen />}
        defaultExpandIcon={<Folder />}
        defaultEndIcon={<Description />}
        expanded={expanded}
        selected={selected}
        onNodeToggle={handleToggle}
        onNodeSelect={handleSelect}
        sx={{ height: '100%', flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
      >
        {directories
          .sort((a, b) => a.name.localeCompare(b.name))
          .filter(dir => !dir.name.startsWith('.'))
          .map(dir => (
            <Directory key={dir.id} id={dir.id} expanded={expanded} />
          ))}
        {files
          .sort((a, b) => a.name.localeCompare(b.name))
          .filter(dir => !dir.name.startsWith('.'))
          .map(file => (
            <File key={file.id} id={file.id} />
          ))}
      </TreeViewComponent>
    </>
  );
};

const TreeViewComponent = styled(TreeView)(() => ({
  '&::-webkit-scrollbar': {
    height: 7,
    width: 7
  },
  '&::-webkit-scrollbar-track': {
    boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.1)',
    webkitBoxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.1)',
    borderRadius: 10
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'darkgrey',
    outline: '1px solid slategrey',
    borderRadius: 10
  }
}));

export default Explorer;
