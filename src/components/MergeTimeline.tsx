import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme, withStyles } from '@material-ui/core/styles';
import { Timeline, TimelineConnector, TimelineContent, TimelineItem, TimelineSeparator } from '@material-ui/lab';
import { CircularProgress, Typography } from '@material-ui/core';
import { green, red } from '@material-ui/core/colors';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';

const StyledCheckIcon = withStyles({
    root: {
        height: 22,
        width: 22,
        margin: 4,
        padding: 0,
        verticalAlign: 'middle',
        color: green[500]
    }
})(CheckIcon);

const StyledClearIcon = withStyles({
    root: {
        height: 22,
        width: 22,
        padding: 0,
        margin: 4,
        verticalAlign: 'middle',
        color: red[500]
    }
})(ClearIcon);

const StyledCircularProgress = withStyles({
    root: {
        margin: 4,
        padding: 2,
        verticalAlign: 'middle'
    }
})(CircularProgress);

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
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
        tl_item: {
            padding: theme.spacing(0, 2),
            '&:before': {
                flex: 0,
                padding: theme.spacing(0)
            }
        },
        tl_content: {
            padding: theme.spacing(0.5, 1, 0),
        },
    }),
);

type CheckState =
    | 'Unchecked'
    | 'Running'
    | 'Passing'
    | 'Failing';

type MissingGitConfigs = string[] | undefined;

const StatusIcon = (state: CheckState) => {
    switch (state) {
        case 'Running':
            return <StyledCircularProgress size={18} />;
        case 'Passing':
            return <StyledCheckIcon />;
        case 'Failing':
            return <StyledClearIcon />;
        default:
            return null;
    }
}

type TimelineProps = {
    commitCountDelta: CheckState,
    branchConflicts: [CheckState, MissingGitConfigs],
    buildStatus: CheckState
}

const TimelineComponent: React.FunctionComponent<TimelineProps> = props => {
    const classes = useStyles();
    const [commitCountDelta, setCommitCountDelta] = useState<CheckState>('Unchecked');
    const [branchConflicts, setBranchConflicts] = useState<[CheckState, MissingGitConfigs]>(['Unchecked', undefined]);
    const [buildStatus, setBuildStatus] = useState<CheckState>('Unchecked');

    useEffect(() => {
        setCommitCountDelta(props.commitCountDelta);
        setBranchConflicts(props.branchConflicts);
        setBuildStatus(props.buildStatus);
    }, [branchConflicts, buildStatus, commitCountDelta, props]);

    return (
        <Timeline align='left' className={classes.timeline} >
            {commitCountDelta != 'Unchecked' ?
                <TimelineItem className={classes.tl_item} >
                    <TimelineSeparator>
                        {StatusIcon(props.commitCountDelta)}
                        {branchConflicts[0] != 'Unchecked' ? <TimelineConnector /> : null}
                    </TimelineSeparator>
                    <TimelineContent className={classes.tl_content} >
                        <Typography>Checking branches for new commits...</Typography>

                    </TimelineContent>
                </TimelineItem>
                : null
            }
            {branchConflicts[0] != 'Unchecked' ?
                <TimelineItem className={classes.tl_item} >
                    <TimelineSeparator>
                        {StatusIcon(props.branchConflicts[0])}
                        {buildStatus != 'Unchecked' ? <TimelineConnector /> : null}
                    </TimelineSeparator>
                    <TimelineContent className={classes.tl_content} >
                        <Typography>Checking for merge conflicts...</Typography>
                        {(branchConflicts[1] !== undefined) ?
                            <Typography color='secondary' variant='body2'>
                                Missing git-config: {JSON.stringify(branchConflicts[1])}
                            </Typography> : null}
                    </TimelineContent>
                </TimelineItem>
                : null
            }
            {buildStatus != 'Unchecked' ?
                <TimelineItem className={classes.tl_item} >
                    <TimelineSeparator>
                        {StatusIcon(props.buildStatus)}
                    </TimelineSeparator>
                    <TimelineContent className={classes.tl_content} >
                        <Typography>Checking for build failures...</Typography>
                    </TimelineContent>
                </TimelineItem>
                : null
            }
        </Timeline>
    );
}

export default TimelineComponent;