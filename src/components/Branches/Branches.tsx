import { makeStyles } from '@material-ui/core';
import { ArrowDropDown, ArrowRight, Error } from '@material-ui/icons';
import { TreeView } from '@material-ui/lab';
import React from 'react';
import { useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import { RootState } from '../../store/store';
import { StyledTreeItem } from '../StyledTreeComponent';
import RepoItem from './RepoItem';

export const useStyles = makeStyles({
    formControl: {
        color: 'rgba(171, 178, 191, 1.0)',
        fontSize: 'small',
        fontFamily: '\'Lato\', Georgia, Serif',
    },
});

/**
 * React Component to display a list of git repositories and the local and remote branches tracked within them.
 * 
 * @returns {React.Component} A React function component.
 */
const Branches = () => {
    const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
    const [expanded, setExpanded] = React.useState(repos[0] ? [repos[0].id] : []); // initial state; expand first listed repo

    const handleToggle = (_event: React.ChangeEvent<Record<string, unknown>>, nodeIds: string[]) => setExpanded(nodeIds);

    return (
        <div className='list-component'>
            <TreeView
                defaultCollapseIcon={<ArrowDropDown />}
                defaultExpandIcon={<ArrowRight />}
                defaultEndIcon={<div style={{ width: 8 }} />}
                expanded={expanded}
                onNodeToggle={handleToggle}
            >
                {repos.length == 0 &&
                    <StyledTreeItem key={'no-repo'} nodeId={'no-repo'}
                        labelText={'[no repos tracked]'}
                        labelIcon={Error}
                    />
                }
                {repos.length > 0 && repos.map(repo => <RepoItem key={repo.id} repoId={repo.id} />)}
            </TreeView>
        </div>
    );
}

export default Branches;