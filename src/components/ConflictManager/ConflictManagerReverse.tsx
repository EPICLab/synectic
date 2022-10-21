import React, { useState } from 'react';
import { DateTime } from 'luxon';
import DataField from '../Card/DataField';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import BranchList from '../BranchList';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import { Card } from '../../store/slices/cards';
import branchSelectors from '../../store/selectors/branches';

const ConflictManagerReverse = (props: Card) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
    const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
    const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);
    const base = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile?.branch ? metafile.branch : ''));

    return (
        <>
            <div className='buttons'>
            </div>
            <DataField title='UUID' textField field={props.id} />
            <DataField title='Path' textField field={metafile?.path?.toString()} />
            <DataField title='Update' textField field={DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)} />
            <DataField title='Repo' textField field={repo ? repo.name : 'Untracked'} />
            {repo && metafile ?
                <>
                    <DataField title='Status' textField field={base ? base.status : ''} />
                    <DataField title='Branch' field={<BranchList cardId={props.id} repoId={repo.id} />} />
                </>
                : undefined}
        </>
    );
};

export default ConflictManagerReverse;
