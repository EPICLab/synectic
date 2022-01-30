import React from 'react';
import type { Card } from '../../types';
import Editor from '../Editor/Editor';
import Diff from '../Diff/Diff';
import Explorer from '../Explorer/Explorer';
import SourceControl from '../SourceControl/SourceControl';
import ConflictManager from '../SourceControl/ConflictManager';
import Browser from '../Browser/Browser';
import { ReposOverview } from '../SourceControl/ReposOverview';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';

const Content: React.FunctionComponent<Card> = card => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, card.metafile));
    if (!metafile) return null;

    switch (card.type) {
        case 'Editor':
            return (<Editor metafileId={card.metafile} />);
        case 'Diff':
            return (<Diff metafile={metafile} />);
        case 'Explorer':
            return (<Explorer rootMetafileId={card.metafile} />);
        case 'SourceControl':
            return (<SourceControl sourceControlId={card.metafile} />);
        case 'Browser':
            return (<Browser />);
        case 'ReposTracker':
            return (<ReposOverview />);
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