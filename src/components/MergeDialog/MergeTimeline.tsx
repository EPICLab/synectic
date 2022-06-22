import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import StatusIcon, { LinearProgressWithLabel, Status } from '../Status';
import { TimelineContent, TimelineItem, TimelineSeparator } from '@material-ui/lab';
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

type MergeTimelineProps = {
    status: Status,
    progress: number,
    subtext: string
}

const MergeTimeline = ({ status, progress, subtext }: MergeTimelineProps) => {
    const styles = useStyles();

    return status === 'Unchecked' ? null :
        <TimelineItem className={styles.item}>
            <TimelineSeparator>
                <StatusIcon status={status} />
            </TimelineSeparator>
            <TimelineContent className={styles.content}>
                <MergeTimelineContent status={status} progress={progress} subtext={subtext} />
            </TimelineContent>
        </TimelineItem>;
}

const MergeTimelineContent = ({ status, progress, subtext }: MergeTimelineProps) => {
    switch (status) {
        case 'Running':
            return <LinearProgressWithLabel value={progress} subtext={subtext} />;
        case 'Passing':
            return <Typography>Merge successful</Typography>;
        case 'Failing':
            return <>
                <Typography color='secondary'>Merge failed: </Typography>
                <Typography color='secondary' variant='body2'>{subtext}</Typography>
            </>
        default:
            return null;
    }
}

export default MergeTimeline;