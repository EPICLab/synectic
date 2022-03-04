import React from 'react';
import type { Card } from '../../types';
import Browser from '../Browser/Browser';
import ConflictManager from '../SourceControl/ConflictManager';
import Diff from '../Diff/Diff';
import Editor from '../Editor/Editor';
import Explorer from '../Explorer/Explorer';
import BranchTracker from '../SourceControl/BranchTracker';
import SourceControl from '../SourceControl/SourceControl';
import Loading from './Loading';

const Content: React.FunctionComponent<Card> = card => {
    switch (card.type) {
        case 'Loading':
            return (<Loading />);
        case 'Editor':
            return (<Editor metafileId={card.metafile} />);
        case 'Diff':
            return (<Diff metafileId={card.metafile} />);
        case 'Explorer':
            return (<Explorer rootMetafileId={card.metafile} />);
        case 'SourceControl':
            return (<SourceControl sourceControlId={card.metafile} />);
        case 'Browser':
            return (<Browser />);
        case 'BranchTracker':
            return (<BranchTracker />);
        case 'ConflictManager':
            return (<ConflictManager metafileId={card.metafile} />);
        default:
            return null;
    }
};

const ContentFront: React.FunctionComponent<Card> = card => {
    return (<div className='card-front'><Content {...card} /></div>)
}

export default ContentFront;