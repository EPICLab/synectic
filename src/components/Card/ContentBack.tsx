import React from 'react';
import { Card } from '../../store/slices/cards';
import BrowserReverse from '../Browser/BrowserReverse';
import DiffReverse from '../Diff/DiffReverse';
import EditorReverse from '../Editor/EditorReverse';
import ExplorerReverse from '../Explorer/ExplorerReverse';
import SourceControlReverse from "../SourceControl/SourceControlReverse";
import { LoadingReverse } from './Loading';

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
        default:
            return null;
    }
};

const ContentBack = (card: Card) => {
    return (<div className='card-back'><Content {...card} /></div>);
}

export default ContentBack;