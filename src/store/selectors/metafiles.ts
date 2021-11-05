import { createDraftSafeSelector } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { relative } from 'path';
import type { UUID } from '../../types';
import { metafilesAdapter } from '../slices/metafiles';
import { RootState } from '../store';

const selectors = metafilesAdapter.getSelectors<RootState>(state => state.metafiles);

const selectByFilepath = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, filepath: PathLike) => filepath,
    (metafiles, filepath) => metafiles.filter(m => (m && m.path) && relative(m.path.toString(), filepath.toString()).length === 0)
);

const selectByRepo = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, repo: UUID) => repo,
    (metafiles, repo) => metafiles.filter(m => m.repo === repo)
)

const selectByBranch = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, filepath: PathLike) => filepath,
    (_state, _filepath, branch: string) => branch,
    (metafiles, filepath, branch) => metafiles.filter(m => m.path === filepath && m.branch === branch)
);

const selectByVirtual = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, name: string) => name,
    (_state, _name, handler: string) => handler,
    (metafiles, name, handler) => metafiles.filter(m => m.name === name && m.handler === handler)
);

const metafileSelectors = { ...selectors, selectByFilepath, selectByRepo, selectByBranch, selectByVirtual };

export default metafileSelectors;