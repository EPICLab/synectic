import React from 'react';
import type { Card } from '../../types';
import { EditorReverse } from '../Editor/Editor';
import { DiffReverse } from '../Diff/Diff';
import { ExplorerReverse } from '../Explorer/Explorer';
import { SourceControlReverse } from '../SourceControl/SourceControl';
import { BrowserReverse } from '../Browser/Browser';
import { LoadingReverse } from './Loading';

const Content: React.FunctionComponent<Card> = card => {
    switch (card.type) {
        case 'Loading':
            return (<LoadingReverse {...card} />);
        case 'Editor':
            return (<EditorReverse {...card} />);
        case 'Diff':
            return (<DiffReverse {...card} />);
        case 'Explorer':
            return (<ExplorerReverse {...card} />);
        case 'SourceControl':
            return (<SourceControlReverse {...card} />);
        case 'Browser':
            return (<BrowserReverse {...card} />);
        case 'BranchTracker':
            return null;
        case 'ConflictManager':
            return null;
        default:
            return null;
    }
};

const ContentBack: React.FunctionComponent<Card> = card => {
    return (<div className='card-back'><Content {...card} /></div>);
}

export default ContentBack;