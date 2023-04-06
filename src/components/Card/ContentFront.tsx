import React from 'react';
import Browser from '../Browser';
import Diff from '../Diff';
import Editor from '../Editor';
import Explorer from '../Explorer';
import SourceControl from '../SourceControl';
import Loading from './Loading';
import { Card } from '../../store/slices/cards';
import Branches from '../Branches';

const Content = (card: Card) => {
    switch (card.type) {
        case 'Editor':
            return (<Editor metafileId={card.metafile} expanded={card.expanded} />);
        case 'Explorer':
            return (<Explorer metafileId={card.metafile} />);
        case 'Browser':
            return (<Browser metafileId={card.metafile} mode={'dark'} />);
        case 'Diff':
            return (<Diff metafileId={card.metafile} />);
        case 'SourceControl':
            return (<SourceControl sourceControlId={card.metafile} />);
        case 'Branches':
            return (<Branches />);
        case 'Loading':
            return (<Loading />);
        default:
            return null;
    }
};

const ContentFront = (card: Card) => {
    return (<div className='card-front'><Content {...card} /></div>)
}

export default ContentFront;