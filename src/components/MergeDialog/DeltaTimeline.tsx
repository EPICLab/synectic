import React from 'react';
import { TimelineConnector, TimelineContent, TimelineItem, TimelineSeparator } from '@material-ui/lab';
import StatusIcon, { LinearProgressWithLabel, Status } from '../StatusIcon';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        item: {
            padding: theme.spacing(0, 2),
            '&:before': {
                flex: 0,
                padding: theme.spacing(0)
            }
        },
        content: {
            padding: theme.spacing(0.5, 1, 0),
        },
    }),
);

type DeltaTimelineProps = {
    status: Status,
    connector?: boolean,
    progress: number,
    subtext: string,
    commits: number
}

const DeltaTimeline = ({ status, connector, progress, subtext, commits }: DeltaTimelineProps) => {
    const classes = useStyles();

    return status === 'Unchecked' ? null :
        <TimelineItem className={classes.item}>
            <TimelineSeparator>
                <StatusIcon status={status} />
                {connector ? <TimelineConnector /> : null}
            </TimelineSeparator>
            <TimelineContent className={classes.content}>
                <DeltaTimelineContent status={status} commits={commits}
                    progress={progress} subtext={subtext} />
            </TimelineContent>
        </TimelineItem>;
}

const DeltaTimelineContent = ({ status, progress, subtext, commits }: DeltaTimelineProps) => {
    switch (status) {
        case 'Running':
            return <LinearProgressWithLabel value={progress} subtext={subtext} />;
        case 'Passing':
            return <Typography>{commits} new commits</Typography>;
        case 'Failing':
            return <Typography>No new commits</Typography>;
        default:
            return null;
    }
}

export default DeltaTimeline;