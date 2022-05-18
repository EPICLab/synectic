import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import { ArrowDropDown, ArrowRight } from '@material-ui/icons';
import metafileSelectors from '../../store/selectors/metafiles';
import BranchRibbon from '../BranchRibbon';
import Directory from './Directory';
import FileComponent from './FileComponent';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import { UUID } from '../../store/types';

const Explorer = (props: { metafile: UUID }) => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByRoot(state, metafile && metafile.path ? metafile.path : ''));
  const directories = metafiles.filter(dir => dir.filetype === 'Directory' && !dir.name.startsWith('.')
    && dir.name !== 'node_modules' && dir.id !== metafile?.id);
  const files = metafiles.filter(file => file.filetype !== 'Directory').sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className='list-component' data-testid='explorer-component'>
        <BranchRibbon metafile={metafile} />
        <TreeView
          defaultCollapseIcon={<ArrowDropDown />}
          defaultExpandIcon={<ArrowRight />}
          defaultEndIcon={<div style={{ width: 8 }} />}
        >
          {directories.map(dir => <Directory key={dir.id} metafile={dir.id} />)}
          {files.map(file => <FileComponent key={file.id} metafile={file.id} />)}
        </TreeView>
      </div>
    </>
  );
};

export default Explorer;