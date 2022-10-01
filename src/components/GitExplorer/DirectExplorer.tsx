import React, { useState } from 'react';
import { Button, createStyles, Dialog, makeStyles, TextField, Theme } from '@material-ui/core';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createBranch, listBranch } from '../../containers/git';
import { RootState } from '../../store/store';
import repoSelectors from '../../store/selectors/repos';

export const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        dialog: {
            width: '100%',
            minWidth: 410,
            maxWidth: 620,
            backgroundColor: theme.palette.background.paper,
        },
        button: {
            margin: theme.spacing(1),
        },
        section1: {
            margin: theme.spacing(3, 2, 1),
        },
        section2: {
            margin: theme.spacing(1, 3),
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            alignContent: 'space-around'
        },
        field: {
            width: '100%',
            margin: theme.spacing(1),
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between'
        },
        textField: {
            minWidth: '65%',
            margin: theme.spacing(1),
        },
        section3: {
            margin: theme.spacing(1, 1),
        },
    }),
);

const DirectExplorer = (props: Modal) => {
    const styles = useStyles();
    const dispatch = useAppDispatch();
    const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
    const [name, setName] = useState('');

    const handleClose = () => dispatch(modalRemoved(props.id));

    const handleClick = async () => {
        const firstRoot = repos[0]?.root;
        if (firstRoot) {
            let created: boolean | undefined = undefined;
            if (name.length > 0) {
                created = await createBranch({
                    dir: firstRoot,
                    branchName: name
                });
            }

            const branches = await listBranch({
                dir: firstRoot,
                all: true,
                verbose: true
            });

            console.log(`root: ${firstRoot.toString()}\ncreated: ${created} [${name}]\nlistBranch:`, branches);
        }
    }

    return (<Dialog open={true} onClose={() => handleClose()}>
        <div className={styles.dialog}>
            <div className={styles.section3}>
                <TextField
                    id={'branchName'}
                    variant='outlined'
                    size='small'
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
                <Button variant='outlined' color='primary' className={styles.button} onClick={() => handleClick()}>Run...</Button>
            </div>
        </div>
    </Dialog>);
}

export default DirectExplorer;