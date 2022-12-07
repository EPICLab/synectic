import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import { ArrowDropDown, ArrowRight } from '@material-ui/icons';
import metafileSelectors from '../../store/selectors/metafiles';
import BranchRibbon from '../Branches/BranchRibbon';
import Directory from './Directory';
import FileComponent from './FileComponent';
import { useAppSelector } from '../../store/hooks';
import { UUID } from '../../store/types';
import { isDescendant } from '../../containers/io';

const Explorer = (props: { metafile: UUID }) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, props.metafile));
  const descendants = useAppSelector(state => metafileSelectors.selectByRoot(state, metafile?.path ?? ''));
  const directories = descendants.filter(child => isDescendant(metafile?.path ?? '', child.path, true) && child.filetype === 'Directory' &&
    !child.name.startsWith('.') && child.name !== 'node_modules' && child.id !== metafile?.id);
  const files = descendants.filter(child => isDescendant(metafile?.path ?? '', child.path, true) && child.filetype !== 'Directory')
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className='list-component' data-testid='explorer-component'>
        <BranchRibbon metafile={metafile} />
        <TreeView
          defaultCollapseIcon={<ArrowDropDown />}
          defaultExpandIcon={<ArrowRight />}
          defaultEndIcon={<div style={{ width: 8 }} />}
        >
          {directories.map(dir => <Directory key={dir.id} id={dir.id} metafiles={descendants} />)}
          {files.map(file => <FileComponent key={file.id} metafile={file} />)}
        </TreeView>
      </div>
    </>
  );
};

export default Explorer;