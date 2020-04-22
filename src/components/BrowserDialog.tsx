import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';

import { RootState } from '../store/root';
import { UUID, Card, Metafile } from '../types';
import { ActionKeys, Actions } from '../store/actions';

type DialogProps = {
    open: boolean;
    onClose: (canceled: boolean, selected: string) => void;
}

export const BrowserDialog: React.FunctionComponent<DialogProps> = () => {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState('');
    const dispatch = useDispatch()
    const metafiles = useSelector((state: RootState) => state.metafiles);

    const submitValue = (e: React.MouseEvent) => {
        e.preventDefault();
        const frmdetails = {
            'URL': url
        }

        setOpen(!open);

        const metafile: Metafile = {
            id: v4(),
            name: `${metafiles[0]?.name}`,
            modified: DateTime.local(),
            handler: 'Browser'
        }
        const addMetafileAction: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
        dispatch(addMetafileAction);

        const card: Card = {
            id: v4(),
            name: frmdetails.URL,
            type: 'Browser',
            related: [],
            created: DateTime.local(),
            modified: DateTime.local(),
            captured: false,
            left: 50,
            top: 50
        }
        const addCardAction: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
        dispatch(addCardAction);

        console.log(frmdetails);
    }


    return (
        <>
            <hr />
            <input type="text" placeholder="URL" onChange={e => setUrl(e.target.value)} />
            <button onClick={submitValue}>Submit</button>
        </>
    )
}



const BrowserButton: React.FunctionComponent = () => {
    const [open, setOpen] = useState(false);
    const metafiles = useSelector((state: RootState) => state.metafiles);
    const dispatch = useDispatch();

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        setOpen(!open);
    };

    const handleClose = (canceled: boolean, selected: UUID) => {
        if (canceled || !selected) {
            setOpen(!open);
            return;
        }

        const metafile: Metafile = {
            id: v4(),
            name: `${metafiles[0].name}`,
            modified: DateTime.local(),
            handler: 'Browser'
        }
        const addMetafileAction: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
        dispatch(addMetafileAction);

        const card: Card = {
            id: v4(),
            name: metafile.name,
            type: 'Browser',
            related: [],
            created: DateTime.local(),
            modified: DateTime.local(),
            captured: false,
            left: 50,
            top: 50
        }
        const addCardAction: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
        dispatch(addCardAction);
        setOpen(!open);
    };

    return (
        <>
            <Button id='diffpicker-button' variant='contained' color='primary' onClick={e => handleClick(e)}>Open Browser...</Button>
            {open ? <BrowserDialog open={open} onClose={handleClose} /> : null}
        </>
    );
}

export default BrowserButton;





