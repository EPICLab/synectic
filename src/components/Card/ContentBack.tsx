import React from 'react';
import EditorReverse from '../Editor/EditorReverse';
import DiffReverse from '../Diff/DiffReverse';
import ExplorerReverse from '../Explorer/ExplorerReverse';
import SourceControlReverse from "../SourceControl/SourceControlReverse";
import BrowserReverse from '../Browser/BrowserReverse';
import { LoadingReverse } from './Loading';
import { Card } from '../../store/slices/cards';

const Content = (card: Card) => {
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
        case 'Branches':
            return null;
        case 'ConflictManager':
            return null;
        default:
            return null;
    }
};

const ContentBack = (card: Card) => {
    return (<div className='card-back'><Content {...card} /></div>);
}

export default ContentBack;