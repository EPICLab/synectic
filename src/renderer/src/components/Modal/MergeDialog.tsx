import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  styled
} from '@mui/material';
import { GitAbort, GitBranch, GitMerge } from '@renderer/assets/GitIcons';
import { useCallback, useEffect, useState } from 'react';
import { MergeOutput, UUID } from 'types/app';
import { Branch } from 'types/branch';
import type { MergeDialog } from 'types/modal';
import useMap from '../../containers/hooks/useMap';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
import { isUnmergedBranch } from '../../store/slices/branches';
import { modalRemoved } from '../../store/slices/modals';
import { mergeBranch, mergeBranchContinue } from '../../store/thunks/branches';
import MergeStatus from './MergeStatus';

const isDefined = window.api.utils.isDefined;

const MergeDialog = ({ props }: { props: MergeDialog }) => {
  const title =
    props.mode === 'abort' ? 'Abort Merge' : props.mode === 'continue' ? 'Continue Merge' : 'Merge';
  const repo = useAppSelector(state => repoSelectors.selectById(state, props.repo));
  const base = useAppSelector(state => branchSelectors.selectById(state, props.base));
  const branches = useAppSelector(state =>
    branchSelectors.selectByIds(state, repo ? [...repo.local, ...repo.remote] : [])
  );
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<UUID[]>([]);
  const conflicted = calcMergingBranch(branches, base);
  const deltas = useMap<UUID, { behind: number; ahead: number }>([]);
  const [result, setResult] = useState<MergeOutput | undefined>(undefined);

  useEffect(() => {
    const mode = props.mode;
    const merging = isUnmergedBranch(base) ? base.merging : undefined;
    console.log({ mode, base, merging, conflicted });
  }, [base, conflicted, props.mode]);

  const calcRef = (branch: Branch | undefined) =>
    branch?.scope === 'remote' ? `${branch.remote}/${branch.ref}` : branch ? branch.ref : '';

  const calcDelta = async (id: UUID) => {
    const branch = branches.find(b => b.id === id);
    const ref = calcRef(branch);

    if (repo && base && branch) {
      const behind = parseInt(
        (
          await window.api.git.revList({
            dir: repo?.root,
            commitish: [base.ref, `^` + ref],
            count: true
          })
        ).trim()
      );
      const ahead = parseInt(
        (
          await window.api.git.revList({
            dir: repo?.root,
            commitish: [ref, `^` + base.ref],
            count: true
          })
        ).trim()
      );
      return { behind, ahead };
    } else return { behind: 0, ahead: 0 };
  };

  const handleClose = useCallback(() => dispatch(modalRemoved(props.id)), [dispatch, props.id]);

  const handleAbort = async () => {
    if (!isDefined(repo) || !isDefined(base)) return;
    setResult(
      await dispatch(
        mergeBranchContinue({ repoId: repo.id, baseBranch: base.id, action: 'abort' })
      ).unwrap()
    );
  };

  const handleMerge = async () => {
    if (!isDefined(repo) || !isDefined(base)) return;

    const commitishBranches = branches
      .filter(branch => selected.includes(branch.id))
      .map(branch => calcRef(branch));

    console.log(`merging ${commitishBranches} into ${base?.scope}/${base?.ref}`);
    setResult(
      await dispatch(
        mergeBranch({ repoId: repo.id, baseBranch: base.id, commitishes: commitishBranches })
      ).unwrap()
    );
  };

  const toggle = async (row: UUID) => {
    if (isDefined(props.mode)) return;
    if (base?.id === row) return;
    if (selected.includes(row)) {
      deltas.delete(row);
      setSelected(selected => selected.filter(id => id !== row));
    } else {
      const delta = await calcDelta(row);
      deltas.set(row, delta);
      setSelected(selected => [...selected, row]);
    }
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      aria-labelledby="merge-dialog-title"
      aria-describedby="merge-dialog-description"
    >
      <DialogTitle id="merge-dialog-title">{title} Dialog</DialogTitle>
      <DialogContent sx={{ px: 2, pb: 1.5, overflowY: 'hidden' }}>
        <DialogContentText sx={{ pb: 1.5 }} id="merge-dialog-description">
          {isDefined(props.mode) ? 'Relevant' : 'Select'} branches from the{' '}
          <Box component="span" fontWeight="fontWeightBold">
            {repo?.name}
          </Box>{' '}
          repository.
        </DialogContentText>
        <TableContainer component={Paper}>
          <Table size="small" aria-label="merge-dialog-options">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 84 }} />
                <TableCell sx={{ minWidth: 200 }}>Branch</TableCell>
                <TableCell sx={{ minWidth: 80 }} align="right">
                  Scope
                </TableCell>
                <TableCell sx={{ minWidth: 100 }} align="right">
                  Delta
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map(branch => (
                <StyledTableRow
                  key={`${branch.scope}/${branch.ref}`}
                  base={base?.id === branch.id}
                  conflicted={conflicted.includes(branch.id)}
                  selected={selected.includes(branch.id)}
                  onClick={() => toggle(branch.id)}
                >
                  <TableCell>
                    <TableRowIcon
                      base={base?.id === branch.id}
                      conflicted={conflicted.includes(branch.id)}
                      selected={selected.includes(branch.id)}
                    />
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {branch.ref}
                  </TableCell>
                  <TableCell align="right">{branch.scope}</TableCell>
                  <TableCell align="right">
                    <TableRowDelta base={base?.ref ?? ''} {...deltas.get(branch.id)} />
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogContent sx={{ px: 2, pb: 1.5 }}>
        <MergeStatus result={result} />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 1.5 }}>
        <Button id="close-button" variant="contained" onClick={handleClose}>
          {isDefined(result) ? 'Close' : 'Cancel'}
        </Button>
        {props.mode === 'abort' && !isDefined(result) ? (
          <Button id="abort-button" variant="contained" onClick={handleAbort}>
            Abort
          </Button>
        ) : null}
        {!isDefined(props.mode) && !isDefined(result) ? (
          <Button
            id="merge-button"
            variant="contained"
            disabled={selected.length === 0}
            onClick={handleMerge}
          >
            Merge
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

type TableRowProps = {
  base: boolean;
  conflicted: boolean;
  selected: boolean;
};

const StyledTableRow = styled(TableRow, {
  shouldForwardProp: prop => prop !== 'base' && prop !== 'conflicted' && prop !== 'selected'
})<TableRowProps>(({ base, conflicted, selected }) => ({
  backgroundColor: base
    ? 'rgba(33, 150, 243, 0.8)'
    : conflicted
    ? 'rgba(240, 128, 128, 0.5)'
    : selected
    ? 'rgba(33, 150, 243, 0.5)'
    : 'none',
  height: 57,
  cursor: base ? 'not-allowed' : 'pointer',
  '&:last-child td, &:last-child th': { border: 0 }
}));

const TableRowIcon = (props: TableRowProps) => {
  return (
    <Box
      sx={{
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {props.base ? (
        <GitBranch />
      ) : props.conflicted ? (
        <GitAbort />
      ) : props.selected ? (
        <GitMerge />
      ) : null}
      <Typography variant="caption">
        {props.base ? 'Base' : props.conflicted ? 'Conflict' : props.selected ? 'Compare' : null}
      </Typography>
    </Box>
  );
};

type BranchDeltaProps = {
  base: string;
  behind?: number;
  ahead?: number;
};

const TableRowDelta = (props: BranchDeltaProps) => {
  const ahead = props.ahead
    ? `${props.ahead} commit${props.ahead > 1 ? 's' : ''} ahead${props.behind ? ', ' : ' '}`
    : '';
  const behind = props.behind ? `${props.behind} commit${props.behind > 1 ? 's' : ''} behind ` : '';
  const base =
    props.ahead && !props.behind
      ? `of ${props.base}`
      : props.behind
      ? `${props.base}`
      : `0 commits ahead, 0 commits behind ${props.base}`;

  return (
    <Tooltip title={`${ahead}${behind}${base}`}>
      <Typography>
        {props.behind} {isDefined(props.behind) && isDefined(props.ahead) ? '|' : ''} {props.ahead}
      </Typography>
    </Tooltip>
  );
};

const calcMergingBranch = (branches: Branch[], base: Branch | undefined): UUID[] => {
  const mergingBranch = isUnmergedBranch(base)
    ? branches.find(b => b.scope === 'local' && b.ref === base.merging)?.id
    : undefined;
  return mergingBranch ? [mergingBranch] : [];
};

export default MergeDialog;
