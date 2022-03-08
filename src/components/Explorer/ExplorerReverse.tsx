import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import branchSelectors from '../../store/selectors/branches';
import DataField from '../Card/DataField';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import SourceControlButton from '../Button/SourceControl';
import BranchList from '../BranchList';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import { useGitHistory } from '../../containers/hooks/useGitHistory';
import { Card } from '../../store/slices/cards';

const ExplorerReverse = (props: Card) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
    const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
    const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);
    const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));
    const { commits, heads, update } = useGitHistory(repo ? repo.id : '');

    useEffect(() => { update(); }, [metafile?.repo]);

    const formatHeadCommit = (branchName: string | undefined) => {
        if (branchName) {
            const sha1 = heads.get(`local/${branchName}`);
            const commitInfo = sha1 ? commits.get(sha1) : undefined;
            if (commitInfo)
                return `${commitInfo.oid.slice(0, 6)}  ${commitInfo.commit.message.slice(0, 15)}`;
        }
        return '[detached]';
    };

    return (
        <>
            <div className='buttons'>
                {repo && metafile && <SourceControlButton repoId={repo.id} metafileId={metafile.id} mode='dark' />}
            </div>
            <DataField title='UUID' textField field={props.id} />
            <DataField title='Path' textField field={metafile?.path?.toString()} />
            <DataField title='Update' textField field={DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)} />
            <DataField title='Repo' textField field={repo ? repo.name : 'Untracked'} />

            {repo && metafile && branch ?
                <>
                    <DataField title='Status' textField field={metafile?.status} />
                    <DataField title='Branch' field={<BranchList cardId={props.id} repoId={repo.id} />} />
                    <DataField title='Head' textField field={formatHeadCommit(branch.ref)} />
                </>
                : undefined}
        </>
    );
};

export default ExplorerReverse;