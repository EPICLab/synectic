import React, { useState } from 'react';
import { Button, createStyles, Dialog, Divider, makeStyles, Theme } from '@material-ui/core';
import * as git from '../../containers/git';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { useAppDispatch } from '../../store/hooks';
import { ExtractedParameter, extractFunctionParameterSignature, transpileSource } from '../../containers/inspector';
import DropSelect from '../DropSelect';
import useMap from '../../containers/hooks/useMap';
import Command from './Command';
import isBoolean from 'validator/lib/isBoolean';
import { isNumber } from '../../containers/utils';

export const useStyles = makeStyles((theme: Theme) =>
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

const GitExplorer = (props: Modal) => {
    const styles = useStyles();
    const dispatch = useAppDispatch();
    const commands = Object.keys(git).map(e => ({ label: e, value: e }));
    const [selectedCommand, setSelectedCommand] = useState<string>('');
    const fn = git[selectedCommand as keyof typeof git]; // eslint-disable-line import/namespace
    const [fields, fieldActions] = useMap<string, ExtractedParameter>([]);

    const handleClose = () => dispatch(modalRemoved(props.id));

    const handleSelect: React.Dispatch<React.SetStateAction<string>> = (value) => {
        fieldActions.reset();
        const fn = git[value as keyof typeof git]; // eslint-disable-line import/namespace
        if (fn) {
            const fnTypes = extractFunctionParameterSignature('./src/containers/git/git-branch.ts', fn.name);
            fnTypes.map(fnType => fieldActions.set(fnType.name, fnType));
        }
        setSelectedCommand(value);
    }

    const handleClick = async () => {
        const params = Array.from(fields.values());
        const args = params.map(p => isBoolean(p.value) ? Boolean(p.value) : isNumber(p.value) ? Number(p.value) : p.value);
        params.map(p => console.log(`${p.name} [${p.type.toString}]: ${p.value}`));

        /**
         * WARNING: Beyond this point is slightly broken code. The `extractFunctionParameterSignature` call in `handleSelect` is able
         * to determine the correct number of parameters (along with their types according to the TypeScript Compiler API), but we cannot
         * effectively recast values from `ExtractedParameter` back into their subsequent types at run-time. we can simulate this process
         * by checking for primitive types (e.g. see the checks above for finding booleans and numbers), but this breaks down with complex
         * types such as Arrays, Functions, and Objects.
         */


        const source = `const result = ${fn.name}(${params.map(p => p.value).join(',')})`;
        const transpiled = transpileSource(source);
        console.log(`transpiled:\n`, transpiled);

        // const result = await fn.call(this, args);
        const result = await fn.apply(this, args);
        console.log(result);
    }

    return (<Dialog open={true} onClose={() => handleClose()}>
        <div className={styles.dialog}>
            <div className={styles.section1}>
                <DropSelect label='Command' value={selectedCommand} setValue={handleSelect} options={commands} />
            </div>
            <Divider variant='middle' />
            <div className={styles.section2}>
                <Command name={selectedCommand} parameters={Array.from(fields.values())} setParameter={fieldActions.set} />
            </div>
            <Divider variant='middle' />
            <div className={styles.section3}>
                <Button variant='outlined' color='primary' className={styles.button} onClick={() => handleClick()}>Run...</Button>
            </div>
        </div>
    </Dialog>);
}

export default GitExplorer;