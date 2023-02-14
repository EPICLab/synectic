import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import { ArrowDropDown, ArrowRight } from '@material-ui/icons';
import metafileSelectors from '../../store/selectors/metafiles';
import BranchRibbon from '../Branches/BranchRibbon';
import Directory from './Directory';
import FileComponent from './FileComponent';
import { useAppSelector } from '../../store/hooks';
import { UUID } from '../../store/types';

const Explorer = ({ metafileId: id }: { metafileId: UUID }) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const { directories, files } = useAppSelector(state => metafileSelectors.selectDescendantsByRoot(state, metafile?.path ?? '', true));

  return (
    <>
      <div className='list-component' data-testid='explorer-component'>
        <BranchRibbon metafile={metafile} />
        <TreeView
          defaultCollapseIcon={<ArrowDropDown />}
          defaultExpandIcon={<ArrowRight />}
          defaultEndIcon={<div style={{ width: 8 }} />}
        >
          {directories.sort((a, b) => a.name.localeCompare(b.name)).map(dir => <Directory key={dir.id} metafileId={dir.id} />)}
          {files.sort((a, b) => a.name.localeCompare(b.name)).map(file => <FileComponent key={file.id} metafileId={file.id} />)}
        </TreeView>
      </div>
    </>
  );
}

export default Explorer;