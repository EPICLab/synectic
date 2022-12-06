import { Chip, createStyles, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Theme, withStyles } from '@material-ui/core';
import { DateTime } from 'luxon';
import React from 'react';
import { isDefined } from '../../containers/utils';
import { useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import repoSelectors from '../../store/selectors/repos';
import { isMergingBranch } from '../../store/slices/branches';
import { Metafile } from '../../store/slices/metafiles';

const StyledTableRow = withStyles((theme: Theme) =>
    createStyles({
        root: {
            '&:nth-of-type(odd)': {
                backgroundColor: theme.palette.action.hover,
            },
        },
    }),
)(TableRow);

const StyledTableCell = withStyles((theme: Theme) =>
    createStyles({
        root: {
            '&:nth-child(odd)': {
                color: theme.palette.text.secondary,
            },
            '&:nth-child(even)': {
                maxWidth: 125,
                overflowWrap: 'break-word',
            },

        },
    }),
)(TableCell);

const Metadata = ({ metafile }: { metafile: Metafile }) => {
    const repo = useAppSelector(state => repoSelectors.selectById(state, metafile.repo ?? ''));
    const branch = useAppSelector(state => branchSelectors.selectById(state, metafile.branch ?? ''));
    const targetA = useAppSelector(state => cardSelectors.selectById(state, metafile.targets?.[0] ?? ''));
    const targetB = useAppSelector(state => cardSelectors.selectById(state, metafile.targets?.[1] ?? ''));

    const { modified, path, conflicts, ...stringifiedOnly } = metafile;
    const merging = isDefined(branch) && isMergingBranch(branch) ? branch.merging : undefined;

    const stringRows = Object.entries(stringifiedOnly)
        .filter(([k]) => !['content', 'contains', 'flags'].includes(k))
        .map(([k, v]) => {
            if (k === 'repo' && repo) return [k, repo.name];
            if (k === 'branch' && branch) return [k, branch.ref];
            if (k === 'targets' && targetA && targetB) return [k, `[${targetA.name} (${targetA.id.slice(-5)}), ${targetB.name} (${targetB.id.slice(-5)})]`];
            if (typeof v === 'string') return [k, v];
            else return [k, JSON.stringify(v)];
        });

    const convertedRows = [
        ['modified', DateTime.fromMillis(modified).toLocaleString(DateTime.DATETIME_SHORT)],
        path ? ['path', path.toString()] : undefined,
        merging ? ['merging', merging] : undefined,
        conflicts && conflicts.length > 0 ? ['conflicts', JSON.stringify(conflicts.map(c => c.toString()))] : undefined
    ].filter(isDefined);

    const rows = [...stringRows, ...convertedRows];

    return (
        <TableContainer component={Paper}>
            <Table size='small' aria-label='metadata-table'>
                <TableBody>
                    {rows.map((row, i) => (
                        <StyledTableRow key={i}>
                            <StyledTableCell component='th' scope='row' align='right'>{row[0]}</StyledTableCell>
                            {row[0] && ['state', 'status'].includes(row[0]) ?
                                <StyledTableCell align='right'>
                                    <Chip label={row[1]} variant='outlined' />
                                </StyledTableCell>
                                :
                                <StyledTableCell align='right'>{row[1]}</StyledTableCell>
                            }
                        </StyledTableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default Metadata;