import React from 'react';
import { Card } from '../../types';
import { EditorReverse } from '../Editor/Editor';
import { DiffReverse } from '../Diff/Diff';
import { ExplorerReverse } from '../Explorer/Explorer';
import { SourceControlReverse } from '../SourceControl/SourceControl';
import { BrowserReverse } from '../Browser/Browser';

export const ContentBack: React.FunctionComponent<Card> = props => {
    switch (props.type) {
        case 'Editor':
            return (<EditorReverse {...props} />);
        case 'Diff':
            return (<DiffReverse {...props} />);
        case 'Explorer':
            return (<ExplorerReverse {...props} />);
        case 'SourceControl':
            return (<SourceControlReverse {...props} />);
        case 'Browser':
            return (<BrowserReverse {...props} />);
        case 'ReposTracker':
            return null;
        case 'ConflictManager':
            return null;
        default:
            return null;
    }
};
