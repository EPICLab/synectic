import React from 'react';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import branchSelectors from '../../store/selectors/branches';
import DataField from '../Card/DataField';
import { Card } from '../../store/slices/cards';


const SourceControlReverse = (props: Card) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile && metafile.repo ? metafile.repo : ''));
    const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));

    return (
        <>
            <div className='buttons'></div>
            <DataField title='Repo' textField field={repo ? repo.name : 'Untracked'} />
            <DataField title='Branch' textField field={branch ? branch.ref : 'Untracked'} />
            <DataField title='Root' textField field={branch ? branch.root.toString() : 'Untracked'} />
        </>
    );
};

export default SourceControlReverse;