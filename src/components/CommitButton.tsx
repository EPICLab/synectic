import React from 'react';
import { Add, Remove } from '@material-ui/icons';
import { GitCommitIcon as Commit } from './GitIcons';
import type { Metafile, Modal, UUID } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import cardSelectors from '../store/selectors/cards';
import metafileSelectors from '../store/selectors/metafiles';
import { RootState } from '../store/store';
import { StyledIconButton } from './StyledIconButton';
import { cardUpdated } from '../store/slices/cards';
import { addItemInArray, removeItemInArray } from '../store/immutables';
import { Tooltip } from '@material-ui/core';
import { fetchVersionControl, isFileMetafile } from '../store/thunks/metafiles';
import { add, remove } from '../containers/git-plumbing';
import { fetchRepoById } from '../store/thunks/repos';
import { metafileUpdated } from '../store/slices/metafiles';
import { modalAdded } from '../store/slices/modals';
import { v4 } from 'uuid';

const CommitButton: React.FunctionComponent<{ cardIds: UUID[] }> = props => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, props.cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const unstaged = metafiles
        .filter(m => m.status ? ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(m.status) : false);
    const staged = metafiles
        .filter(m => m.status ? ['added', 'modified', 'deleted'].includes(m.status) : false);
    const dispatch = useAppDispatch();

    const stage = async () => {
        await Promise.all(unstaged
            .filter(isFileMetafile)
            .map(async metafile => {
                const repo = metafile.repo ? await dispatch(fetchRepoById(metafile.repo)).unwrap() : undefined;
                if (repo && metafile.branch) {
                    await add(metafile.path, repo, metafile.branch);
                    const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
                    dispatch(metafileUpdated({ ...metafile, ...vcs }));
                }
            })
        );
    };

    const unstage = async () => {
        await Promise.all(staged
            .filter(isFileMetafile)
            .map(async metafile => {
                const repo = metafile.repo ? await dispatch(fetchRepoById(metafile.repo)).unwrap() : undefined;
                if (repo && metafile.branch) {
                    await remove(metafile.path, repo, metafile.branch);
                    const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
                    dispatch(metafileUpdated({ ...metafile, ...vcs }));
                }
            })
        );
    };

    const commit = async () => {
        const firstMetafile = staged[0];
        if (firstMetafile.repo && firstMetafile.branch) {
            const commitDialogModal: Modal = {
                id: v4(),
                type: 'CommitDialog',
                target: firstMetafile.id,
                options: {
                    'repo': firstMetafile.repo,
                    'branch': firstMetafile.branch
                }
            };
            dispatch(modalAdded(commitDialogModal));
        }
    };

    // checks for whether button is on a single card and also captured
    const isCaptured = cards.length == 1 && cards[0].captured !== undefined;

    const onHover = (target: Metafile[]) => {
        if (cards.length > 1) {
            cards.filter(c => target.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected') })));
    }

    return (
        <>
            {unstaged.length > 0 && !isCaptured &&
                <Tooltip title='Stage'>
                    <StyledIconButton
                        aria-label='stage'
                        onClick={stage}
                        onMouseEnter={() => onHover(unstaged)}
                        onMouseLeave={offHover}
                    >
                        <Add />
                    </StyledIconButton>
                </Tooltip>}
            {staged.length > 0 && !isCaptured &&
                <Tooltip title='Unstage'>
                    <StyledIconButton
                        aria-label='unstage'
                        onClick={unstage}
                        onMouseEnter={() => onHover(staged)}
                        onMouseLeave={offHover}
                    >
                        <Remove />
                    </StyledIconButton>
                </Tooltip>}
            {staged.length > 0 && !isCaptured &&
                <Tooltip title='Commit'>
                    <StyledIconButton
                        aria-label='commit'
                        onClick={commit}
                        onMouseEnter={() => onHover(staged)}
                        onMouseLeave={offHover}
                    >
                        <Commit />
                    </StyledIconButton>
                </Tooltip>}
        </>
    );
}

export default CommitButton;