import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { createStyles, FormControl, InputLabel, MenuItem, Select, Theme } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        dropSelect: {
            margin: theme.spacing(1),
            width: `calc(100% - ${theme.spacing(2)}px)`
        },
        input: {
            backgroundColor: theme.palette.background.paper,
            padding: 3
        },
    }),
);

type DropSelectProps = {
    label: string;
    target: string;
    setTarget: React.Dispatch<React.SetStateAction<string>>;
    options: { key: string, value: string }[];
    width?: number | undefined;
}

const DropSelect = (props: DropSelectProps) => {
    const styles = useStyles();
    const selected = props.target === '' || !props.options.find(o => o.key === props.target) ? '' : props.target;

    return (
        <FormControl variant='outlined' className={styles.dropSelect} margin='dense'>
            <InputLabel id={`${props.label}-select-label`} className={styles.input}>{props.label}</InputLabel>
            <Select
                MenuProps={{
                    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                    transformOrigin: { vertical: 'top', horizontal: 'left' },
                    getContentAnchorEl: null
                }}
                labelId={`${props.label}-select-label`}
                id={`${props.label}-select`}
                value={selected}
                fullWidth={true}
                onChange={(event) => props.setTarget(event.target.value as string)}
            >
                <MenuItem value='None' dense={true}>None</MenuItem>
                {props.options.map(opt => <MenuItem key={opt.key} value={opt.key} dense={true}>{opt.value}</MenuItem>)}
            </Select>
        </FormControl >

    );
}

export default DropSelect;