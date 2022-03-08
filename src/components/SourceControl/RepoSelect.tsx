import React, { Dispatch, SetStateAction } from 'react';
import { UUID } from '../../store/types';
import { Repository } from '../../store/slices/repos';
import DropSelect from '../DropSelect';

type RepoSelectProps = {
    repos: Repository[];
    optionsFilter?: (repo: Repository) => boolean;
    selectedRepo: UUID;
    setSelectedRepo: Dispatch<SetStateAction<UUID>>;
}

const RepoSelect = (props: RepoSelectProps) => {
    const predicate = props.optionsFilter ? props.optionsFilter : undefined; // Cannot descriminate types from variables; see https://github.com/microsoft/TypeScript/issues/10530
    const options = (predicate ? props.repos.filter(r => predicate(r)) : props.repos).map(r => { return { key: r.id, value: r.name }; });
    return (<DropSelect label='Repository' target={props.selectedRepo} setTarget={props.setSelectedRepo} options={options} />)
}

export default RepoSelect;