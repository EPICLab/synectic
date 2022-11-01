import React, { useState } from 'react';
import { DateTime } from 'luxon';
import DataField from '../Card/DataField';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import SourceControlButton from '../Button/SourceControl';
import BranchList from '../BranchList';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import { Card } from '../../store/slices/cards';
import RefreshButton from '../Button/Refresh';

const EditorReverse = (props: Card) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
    const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
    const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);

    return (
        <>
            <div className='buttons'>
                {metafile && repo ? <SourceControlButton repoId={repo.id} metafileId={metafile.id} mode='dark' /> : undefined}
                {metafile ? <RefreshButton metafileIds={[metafile.id]} mode='dark' /> : undefined}
            </div>
            <DataField title='UUID' textField field={props.id} />
            <DataField title='Path' textField field={metafile?.path?.toString()} />
            <DataField title='Update' textField field={DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)} />
            <DataField title='State' textField field={metafile ? metafile.state : ''} />
            <DataField title='Repo' textField field={repo ? repo.name : 'Untracked'} />
            {repo && metafile ?
                <>
                    <DataField title='Status' textField field={metafile.status} />
                    <DataField title='Branch' field={<BranchList cardId={props.id} repoId={repo.id} />} />
                </>
                : undefined}
        </>
    );
};

export default EditorReverse;
