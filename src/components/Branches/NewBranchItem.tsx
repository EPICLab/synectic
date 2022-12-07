import { InputAdornment, makeStyles, TextField } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import React, { useState } from 'react';
import { createBranch } from '../../containers/git';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import { updateBranches } from '../../store/thunks/branches';
import { GitBranchIcon } from '../GitIcons';
import { StyledTreeItem } from '../StyledTreeComponent';

export const useStyles = makeStyles({
    input: {
        fontSize: 14,
        fontWeight: 800
    },
    textField: {
        width: '85%',
        '& .MuiOutlinedInput-adornedStart': {
            color: 'inherit',
            paddingLeft: 0,
            '& .MuiTypography-root': {
                color: 'inherit',
                fontSize: 14,
                paddingTop: 1,
            },
        }
    },
});

const NewBranchItem = (props: { repoId: string }) => {
    const repo = useAppSelector(state => repoSelectors.selectById(state, props.repoId));
    const [expanded, setExpanded] = useState(false);
    const [branchName, setBranchName] = useState('');
    const dispatch = useAppDispatch();
    const styles = useStyles();

    const handleKeyDown = async (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (repo) {
                const success = await createBranch({ dir: repo.root, branchName: branchName });
                console.log(`creating branch: ${branchName} => ${success ? 'success' : 'failure'}`);
                if (success) {
                    await dispatch(updateBranches(repo));
                    setExpanded(false);
                }
                else console.log(`error`);
            }
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            setExpanded(false);
        }
    }

    return (
        <>
            {expanded ?
                <StyledTreeItem
                    key={`repo-${props.repoId}-new-branch`}
                    nodeId={`repo-${props.repoId}-new-branch`}
                    labelNode={
                        <TextField
                            id={`repo-${props.repoId}-new-branch`}
                            className={styles.textField}
                            variant='outlined'
                            size='small'
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e)}
                            inputRef={input => input && input.focus()}
                            InputProps={{
                                className: styles.input,
                                startAdornment: <InputAdornment position='start'>local/</InputAdornment>,
                            }}
                        />
                    }
                    labelIcon={GitBranchIcon}
                />
                :
                <StyledTreeItem
                    key={`repo-${props.repoId}-new-branch`}
                    nodeId={`repo-${props.repoId}-new-branch`}
                    labelText={'[new branch]'}
                    labelIcon={Add}
                    onClick={() => setExpanded(!expanded)}
                />
            }
        </>
    )
}

export default NewBranchItem;