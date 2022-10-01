import React from 'react';
import { createStyles, makeStyles, MenuItem, TextField, Theme, Tooltip, Typography } from '@material-ui/core';
import { ExtractedParameter } from '../../containers/inspector';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        dialog: {
            width: '100%',
            minWidth: 410,
            maxWidth: 620,
            backgroundColor: theme.palette.background.paper,
        },
        button: {
            margin: theme.spacing(1),
        },
        section1: {
            margin: theme.spacing(3, 2, 1),
        },
        section2: {
            margin: theme.spacing(1, 3),
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            alignContent: 'space-around'
        },
        field: {
            width: '100%',
            margin: theme.spacing(1),
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between'
        },
        textField: {
            minWidth: '65%',
            margin: theme.spacing(1),
        },
        section3: {
            margin: theme.spacing(1, 1),
        },
    }),
);

/**
 * Component for a parameter to a `git` command extracted using the 
 * [TypeScript Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)
 * 
 * @param props Prop object for a specific parameter field.
 * @param props.parameter Extracted type information for a specific parameter field.
 * @param props.onChange Callback fired when the value changes.
 * @returns {React.Component} A React function component.
 */
const Parameter = (props: {
    parameter: ExtractedParameter;
    onChange: (name: string, value: string) => void;
}) => {
    const styles = useStyles();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        props.onChange(props.parameter.name, event.target.value);
    }

    return (
        <div className={styles.field}>
            <Tooltip title={props.parameter.optional ? 'Optional' : ''}>
                <Typography variant='body2' color={props.parameter.optional ? 'textSecondary' : 'textPrimary'}>
                    {props.parameter.name}:
                </Typography>
            </Tooltip>
            {props.parameter.type.toString === 'boolean' ?
                <TextField
                    id={props.parameter.name}
                    select
                    variant='outlined'
                    size='small'
                    required={!props.parameter.optional}
                    // error={!valid}
                    value={props.parameter.value}
                    onChange={handleChange}
                    helperText={`type: ${props.parameter.type.toString}`}
                >
                    <MenuItem value={'true'}>true</MenuItem>
                    <MenuItem value={'false'}>false</MenuItem>
                </TextField>
                :
                <TextField
                    id={props.parameter.name}
                    variant='outlined'
                    size='small'
                    required={!props.parameter.optional}
                    // error={!valid}
                    value={props.parameter.value}
                    onChange={handleChange}
                    helperText={`type: ${props.parameter.type.toString}`}
                />
            }
        </div>
    );
}

export default Parameter;