import React, { useEffect } from 'react';
import TreeView from '@material-ui/lab/TreeView';
import { Info, ArrowDropDown, ArrowRight } from '@material-ui/icons';
import { relative } from 'path';
import branchSelectors from '../../store/selectors/branches';
import metafileSelectors from '../../store/selectors/metafiles';
import BranchRibbon from '../BranchRibbon';
import Directory from './Directory';
import { fetchMetafile, isDirectoryMetafile, isFileMetafile } from '../../store/thunks/metafiles';
import FileComponent from './FileComponent';
import { getIgnore } from '../../containers/git-plumbing';
import { readDirAsyncDepth } from '../../containers/io';
import { RootState } from '../../store/store';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { UUID } from '../../store/types';

const Explorer = (props: { rootMetafileId: UUID }) => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.rootMetafileId));
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));
  const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByRoot(state, metafile && metafile.path ? metafile.path : ''));
  const dispatch = useAppDispatch();

  useEffect(() => {
    const asyncFetch = async () => {
      if (metafile && metafile.path) {
        const root = metafile.path;
        const ignore = await getIgnore(root, true);
        const filepaths = (await readDirAsyncDepth(root, 1))
          .filter(p => p !== root)                                     // filter root filepath from results
          .filter(p => !p.includes('.git'))                            // filter git directory
          .filter(p => !ignore.ignores(relative(root.toString(), p))); // filter based on git-ignore rules
        await Promise.all(filepaths.map(f => dispatch(fetchMetafile({ filepath: f }))));
      }
    }
    asyncFetch();
  }, []);

  return (
    <>
      <div className='list-component' data-testid='explorer-component'>
        {branch ? <BranchRibbon branch={branch.ref} /> : null}
        <TreeView
          defaultCollapseIcon={<ArrowDropDown />}
          defaultExpandIcon={<ArrowRight />}
          defaultEndIcon={<div style={{ width: 8 }} />}
        >
          {metafiles.length === 0 ?
            <StyledTreeItem key={'loading'} nodeId={'loading'} labelText={'loading...'} labelIcon={Info} /> : null}
          {metafiles.filter(isDirectoryMetafile).filter(dir => !dir.name.startsWith('.') && dir.name !== 'node_modules').map(dir => <Directory key={dir.id} {...dir} />)}
          {metafiles.filter(isFileMetafile).sort((a, b) => a.name.localeCompare(b.name)).map(file => <FileComponent key={file.id} metafileId={file.id} />)}
        </TreeView>
      </div>
    </>
  );
};

export default Explorer;