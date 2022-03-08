import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Timeline, TimelineConnector, TimelineContent, TimelineItem, TimelineSeparator } from '@material-ui/lab';
import { Typography } from '@material-ui/core';
import StatusIcon, { Status } from '../StatusIcon';

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

type MissingGitConfigs = string[] | undefined;

type TimelineProps = {
    commitCountDelta: Status,
    branchConflicts: [Status, MissingGitConfigs],
    // buildStatus: Status
}

const TimelineComponent = (props: TimelineProps) => {
    const classes = useStyles();
    const [commitCountDelta, setCommitCountDelta] = useState<Status>('Unchecked');
    const [branchConflicts, setBranchConflicts] = useState<[Status, MissingGitConfigs]>(['Unchecked', undefined]);
    // const [buildStatus, setBuildStatus] = useState<Status>('Unchecked');

    useEffect(() => {
        setCommitCountDelta(props.commitCountDelta);
        setBranchConflicts(props.branchConflicts);
        // setBuildStatus(props.buildStatus);
    }, [branchConflicts, commitCountDelta, props]);

    return (
        <Timeline align='left' className={classes.timeline} >
            {commitCountDelta != 'Unchecked' ?
                <TimelineItem className={classes.tl_item} >
                    <TimelineSeparator>
                        <StatusIcon status={props.commitCountDelta} />
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
                        <StatusIcon status={props.branchConflicts[0]} />
                        {/* {buildStatus != 'Unchecked' ? <TimelineConnector /> : null} */}
                    </TimelineSeparator>
                    <TimelineContent className={classes.tl_content} >
                        <Typography>Checking for merge conflicts...</Typography>
                        {/* {(branchConflicts[1] !== undefined) ?
                            <Typography color='secondary' variant='body2'>
                                Missing git-config: {JSON.stringify(branchConflicts[1])}
                            </Typography> : null} */}
                        {(branchConflicts[0] === 'Failing') ?
                            <Typography color='secondary' variant='body2'>
                                Merge conflicts: Resolve conflicts before merging
                            </Typography> : null}
                    </TimelineContent>
                </TimelineItem>
                : null
            }
            {/* {buildStatus != 'Unchecked' ?
                <TimelineItem className={classes.tl_item} >
                    <TimelineSeparator>
                        <StatusIcon status={props.buildStatus} />
                    </TimelineSeparator>
                    <TimelineContent className={classes.tl_content} >
                        <Typography>Checking for build failures...</Typography>
                    </TimelineContent>
                </TimelineItem>
                : null
            } */}
        </Timeline>
    );
}

export default TimelineComponent;