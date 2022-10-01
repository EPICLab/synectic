import React, { useState } from 'react';
import { DateTime } from 'luxon';
import branchSelectors from '../../store/selectors/branches';
import DataField from '../Card/DataField';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import SourceControlButton from '../Button/SourceControl';
import BranchList from '../BranchList';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import { Card } from '../../store/slices/cards';

const ExplorerReverse = (props: Card) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
    const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
    const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);
    const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));

    return (
        <>
            <div className='buttons'>
                {repo && metafile && <SourceControlButton repoId={repo.id} metafileId={metafile.id} mode='dark' />}
            </div>
            <DataField title='UUID' textField field={props.id} />
            <DataField title='Path' textField field={metafile?.path?.toString()} />
            <DataField title='Update' textField field={DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)} />
            <DataField title='Repo' textField field={repo ? repo.name : 'Untracked'} />

            {metafile && repo && branch ?
                <>
                    <DataField title='Status' textField field={metafile.status} />
                    <DataField title='Branch' field={<BranchList cardId={props.id} repoId={repo.id} />} />
                </>
                : undefined}
        </>
    );
};

export default ExplorerReverse;