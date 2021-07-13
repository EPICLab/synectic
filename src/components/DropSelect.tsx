import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { FormControl, InputLabel, MenuItem, Select } from '@material-ui/core';

const useStyles = makeStyles({
    root: {
        height: 32,
        padding: 5,
        margin: 7
    },
    select: {
        padding: 2,
        margin: 5,
        paddingLeft: 8,
        width: 250,
        height: 32
    },
    selectItem: {
        padding: 2,
        margin: 2
    }
});

type DropSelectProps = {
    label: string;
    target: string;
    setTarget: React.Dispatch<React.SetStateAction<string>>;
    options: { key: string, value: string }[];
}

const DropSelect: React.FunctionComponent<DropSelectProps> = props => {
    const classes = useStyles();
    return (
        <FormControl variant='outlined' className={classes.root}>
            <InputLabel id={`${props.label}-select-label`}>{props.label}</InputLabel>
            <Select
                labelId={`${props.label}-select-label`}
                id={`${props.label}-select`}
                className={classes.select}
                value={props.target}
                onChange={(event) => props.setTarget(event.target.value as string)}
            >
                <MenuItem value='None' className={classes.selectItem}>None</MenuItem>
                {props.options.map(opt => <MenuItem key={opt.key} value={opt.key} className={classes.selectItem}>{opt.value}</MenuItem>)}
            </Select>
        </FormControl>
    );
}

export default DropSelect;