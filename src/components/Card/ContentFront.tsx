import React from 'react';
import { Card } from '../../types';
import Editor from '../Editor/Editor';
import Diff from '../Diff/Diff';
import Explorer from '../Explorer/Explorer';
import SourceControl from '../SourceControl/SourceControl';
import ConflictManager from '../SourceControl/ConflictManager';
import Browser from '../Browser/Browser';
import { ReposOverview } from '../ReposOverview';
import { RootState } from '../../store/store';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';

export const ContentFront: React.FunctionComponent<Card> = props => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
    if (!metafile)
        return null;
    switch (props.type) {
        case 'Editor':
            return (<Editor metafile={metafile} />);
        case 'Diff':
            return (<Diff metafile={metafile} />);
        case 'Explorer':
            return (<Explorer root={metafile} />);
        case 'SourceControl':
            return (<SourceControl root={metafile} />);
        case 'Browser':
            return (<Browser />);
        case 'ReposTracker':
            return (<ReposOverview />);
        case 'ConflictManager':
            return (<ConflictManager root={metafile} />);
        default:
            return null;
    }
};
