import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { FormControl, InputLabel, MenuItem, Select } from '@material-ui/core';

const useStyles = makeStyles({
    root: {
        margin: 7
    },
    input: {
        backgroundColor: 'white',
        padding: 3
    },
    select: {
        minWidth: 250,
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
        <FormControl variant='outlined' className={classes.root} margin='dense'>
            <InputLabel id={`${props.label}-select-label`} className={classes.input}>{props.label}</InputLabel>
            <Select
                MenuProps={{
                    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                    transformOrigin: { vertical: 'top', horizontal: 'left' },
                    getContentAnchorEl: null
                }}
                labelId={`${props.label}-select-label`}
                id={`${props.label}-select`}
                className={classes.select}
                value={props.target}
                onChange={(event) => props.setTarget(event.target.value as string)}
            >
                <MenuItem value='None' dense={true}>None</MenuItem>
                {props.options.map(opt => <MenuItem key={opt.key} value={opt.key} dense={true}>{opt.value}</MenuItem>)}
            </Select>
        </FormControl >

    );
}

export default DropSelect;