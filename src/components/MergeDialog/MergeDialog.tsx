import { Button, Dialog, Divider, Grid, Typography } from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { mergeBranch, MergeOutput } from '../../containers/git';
import { isDefined } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import repoSelectors from '../../store/selectors/repos';
import { branchUpdated, MergingBranch } from '../../store/slices/branches';
import { isFilebasedMetafile } from '../../store/slices/metafiles';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { addBranch, updateBranches } from '../../store/thunks/branches';
import { buildCard } from '../../store/thunks/cards';
import { fetchMetafile, updateVersionedMetafile } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import BranchSelect from '../Branches/BranchSelect';
import RepoSelect from '../RepoSelect';
import MergeStatus from './MergeStatus';
import MergeButtons from './MergeButtons';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        mergeDialog: {
            width: '100%',
            maxWidth: 530,
            backgroundColor: theme.palette.background.paper,
        },
        timeline: {
            margin: theme.spacing(1),
            '& > :last-child .MuiTimelineItem-content': {
                height: 28
            }
        },
        button: {
            margin: theme.spacing(1),
        },
        section1: {
            margin: theme.spacing(3, 2, 1),
        },
        section2: {
            margin: theme.spacing(1, 1),
        },
    }),
);

const MergeDialog = (props: Modal) => {
    const cards = useAppSelector(state => cardSelectors.selectAll(state));
    const repos = useAppSelector(state => repoSelectors.selectEntities(state));
    const branches = useAppSelector(state => branchSelectors.selectEntities(state));
    const dispatch = useAppDispatch();
    const styles = useStyles();

    const [repoId, setRepoId] = useState<UUID | undefined>(props.options?.['repo'] ? props.options?.['repo'] as UUID : undefined);
    const [baseId, setBaseId] = useState<UUID | undefined>(props.options?.['base'] ? props.options?.['base'] as UUID : undefined);
    const [compareId, setCompareId] = useState<UUID | undefined>(props.options?.['compare'] ? props.options?.['compare'] as UUID : undefined);
    const [result, setResult] = useState<MergeOutput | undefined>(undefined);

    const repo = repoId ? repos[repoId] : undefined;
    const base = baseId ? branches[baseId] : undefined;
    const compare = compareId ? branches[compareId] : undefined;
    const mergeable = isDefined(repo) && isDefined(base) && isDefined(compare) && `${base.scope}/${base.ref}` !== `${compare.scope}/${compare.ref}`;

    const start = async () => {
        if (!mergeable) return;

        const baseBranch = await dispatch(addBranch({ ref: base.ref, root: repo.root })).unwrap();
        const compareBranch = await dispatch(addBranch({ ref: compare.ref, root: repo.root })).unwrap();

        let result: MergeOutput;
        try {
            result = await mergeBranch({
                dir: baseBranch?.root ?? repo.root,
                base: baseBranch?.ref ?? base.ref,
                commitish: compareBranch?.ref ?? compare.ref
            });
            console.log(`INPER:`, { result });
            setResult(result);
        } catch (error) {
            setResult({
                status: 'Failing',
                alreadyMerged: false,
                fastForward: false,
                output: error as string
            });
            return;
        }

        await dispatch(updateBranches(repo));

        if (result.conflicts) {
            const conflicts = await Promise.all(result.conflicts
                .map(async filepath => dispatch(fetchMetafile({ path: filepath })).unwrap()));
            await Promise.all(conflicts.filter(isFilebasedMetafile)
                .map(metafile => dispatch(updateVersionedMetafile(metafile)).unwrap()));

            if (baseBranch) dispatch(branchUpdated({
                ...baseBranch,
                status: 'unmerged',
                merging: compare.ref
            } as MergingBranch));

            const baseMetafile = await dispatch(fetchMetafile({ path: base.root, handlers: ['Explorer'] })).unwrap();

            const card = cards.find(c => c.metafile === baseMetafile.id);
            if (!card) await dispatch(buildCard({ metafile: baseMetafile }));
        }
    }

    return (
        <Dialog id='dialog' open={true} onClose={() => dispatch(modalRemoved(props.id))}>
            <div className={styles.mergeDialog}>
                <div className={styles.section1}>
                    <Grid container alignItems='center'>
                        <Grid item xs>
                            <Typography gutterBottom variant='h4'>
                                Merge
                            </Typography>
                        </Grid>
                        <Grid item>
                        </Grid>
                    </Grid>
                    <Typography color='textSecondary' variant='body2'>
                        Select the repository, base, and compare branches to merge.
                    </Typography>
                </div>
                <Divider variant='middle' />
                <div className={styles.section2}>
                    <Grid container alignItems='center' justifyContent='center'>
                        <Grid item xs={12}>
                            <RepoSelect
                                repos={Object.values(repos).filter(isDefined)}
                                selectedRepo={repoId ? repoId : ''}
                                setSelectedRepo={setRepoId}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <BranchSelect
                                label='Base'
                                repo={repo}
                                selectedBranch={baseId ? baseId : ''}
                                optionsFilter={b => b.id !== compareId}
                                setSelectedBranch={setBaseId}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <BranchSelect
                                label='Compare'
                                repo={repo}
                                selectedBranch={compareId ? compareId : ''}
                                optionsFilter={b => b.id !== baseId}
                                setSelectedBranch={setCompareId}
                            />
                        </Grid>
                    </Grid>
                    <MergeStatus result={result} />
                </div>
                <div className={styles.section2}>
                    <MergeButtons modalId={props.id} status={result?.status ?? 'Unchecked'} mergeable={mergeable} start={start} />
                </div>
            </div>
        </Dialog>
    );
}

export default MergeDialog;