import React from 'react';
import { ExtractedParameter } from '../../containers/inspector';
import Parameter from './Parameter';

type GitCommand = {
    readonly name: string;
    readonly parameters: ExtractedParameter[];
    setParameter: (parameter: string, value: ExtractedParameter) => void;
}

const Command = (command: GitCommand) => {

    const changeValue = (name: string, value: string) => {
        const parameter = command.parameters.find(p => p.name === name);
        if (parameter) command.setParameter(parameter.name, { ...parameter, value: value });
    }

    return (
        <>
            {command.parameters.map((p, i) => <Parameter key={i} parameter={p} onChange={changeValue} />)}
        </>
    )
}

export default Command;