import React, { useState } from 'react';
import { isDefined } from '../../containers/utils';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { Card } from '../../store/slices/cards';
import { RootState } from '../../store/store';
import BranchList from '../Branches/BranchList';
import BranchesViewButton from '../Button/BranchesView';
import MetadataViewButton from '../Button/MetadataView';
import RefreshButton from '../Button/Refresh';
import SourceControlButton from '../Button/SourceControl';
import Metadata from '../Card/Metadata';

const EditorReverse = (props: Card) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
    const repo = useAppSelector(state => repoSelectors.selectById(state, metafile?.repo ?? ''));
    const [view, setView] = useState('branches');

    return (
        <>
            <div className='buttons'>
                <MetadataViewButton onClickHandler={() => setView('metadata')} enabled={isDefined(metafile)} mode='dark' />
                <BranchesViewButton onClickHandler={() => setView('branches')} enabled={isDefined(repo)} mode='dark' />
                {isDefined(metafile) && isDefined(repo) ? <SourceControlButton repoId={repo.id} metafileId={metafile.id} mode='dark' /> : undefined}
                {isDefined(metafile) ? <RefreshButton metafileIds={[metafile.id]} mode='dark' /> : undefined}
            </div>
            <div className='area'>
                {view === 'metadata' && isDefined(metafile) ? <Metadata metafile={metafile} /> : undefined}
                {view === 'branches' && isDefined(repo) ? <BranchList cardId={props.id} repoId={repo.id} /> : undefined}
            </div>
        </>
    );
};

export default EditorReverse;
