import React, { Dispatch, SetStateAction } from 'react';
import DropSelect from '../DropSelect';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import { Repository } from '../../store/slices/repos';
import { UUID } from '../../store/types';
import { Branch } from '../../store/slices/branches';

const emptyRepo: Repository = {
    id: '',
    name: '',
    root: '',
    corsProxy: '',
    url: '',
    default: '',
    local: [],
    remote: [],
    oauth: 'github',
    username: '',
    password: '',
    token: ''
}

type BranchSelectProps = {
    label: string;
    repo: Repository | undefined;
    optionsFilter?: (branch: Branch) => boolean;
    selectedBranch: UUID;
    setSelectedBranch: Dispatch<SetStateAction<UUID>>;
}

const BranchSelect = (props: BranchSelectProps) => {
    const branches = useAppSelector((state: RootState) => branchSelectors.selectByRepo(state, props.repo ? props.repo : emptyRepo, true));
    const predicate = props.optionsFilter ? props.optionsFilter : undefined; // Cannot descriminate types from variables; see https://github.com/microsoft/TypeScript/issues/10530
    const options = (predicate ? branches.filter(b => predicate(b)) : branches).map(b => { return { key: b.id, value: b.ref }; });

    return (<DropSelect label={props.label} target={props.selectedBranch} setTarget={props.setSelectedBranch} options={options} />);
}

export default BranchSelect;
