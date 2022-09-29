import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { createStyles, FormControl, FormHelperText, InputLabel, MenuItem, Select, Theme } from '@material-ui/core';

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
    options: { label: string, value: string }[];
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
    label?: string | undefined;
    width?: number | string | undefined;
    required?: boolean;
    error?: boolean;
    helperText?: React.ReactNode;
}

const DropSelect = (props: DropSelectProps) => {
    const styles = useStyles();
    const selected = props.value === '' || !props.options.find(o => o.label === props.value) ? '' : props.value;

    return (
        <FormControl
            variant='outlined'
            required={props.required ? true : false}
            error={props.error ? true : false}
            className={styles.dropSelect}
            style={{ width: props.width ? props.width : '' }}
            margin='dense'
        >
            {props.label ? <InputLabel id={`${props.label}-select-label`} className={styles.input}>{props.label}</InputLabel> : undefined}
            <Select
                MenuProps={{
                    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                    transformOrigin: { vertical: 'top', horizontal: 'left' },
                    getContentAnchorEl: null
                }}
                labelId={`${props.label}-select-label`}
                id={`${props.label}-select`}
                value={selected}
                fullWidth={props.width ? false : true}
                onChange={(event) => props.setValue(event.target.value as string)}
            >
                <MenuItem value='None' dense={true}>None</MenuItem>
                {props.options.map(opt => <MenuItem key={opt.label} value={opt.label} dense={true}>{opt.value}</MenuItem>)}
            </Select>
            {props.helperText ? <FormHelperText>{props.helperText}</FormHelperText> : undefined}
        </FormControl >

    );
}

export default DropSelect;