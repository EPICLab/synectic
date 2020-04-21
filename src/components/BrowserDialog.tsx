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
    onClose: (canceled: boolean, selected: UUID) => void;
}

export const BrowserDialog: React.FunctionComponent<DialogProps> = props => {

    const [open, setOpen] = useState(false);
    const metafiles = useSelector((state: RootState) => state.metafiles);
    const dispatch = useDispatch();
    const [selectedValue/*, setSelectedValue*/] = useState('website.com');

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
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
            name: `${selectedValue}`,
            // name: metafile.name,
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
        // alert(`${selectedValue}`)
    };

    if (props.open) {
        return (
            <>
                <div>
                    <label>Enter URL:</label>
                    <input type="text" /*defaultValue={selectedValue}*/></input>
                    <input type="submit" value="Go" onClick={handleClick} />
                </div>
                {/* <form onClick={handleClick}>
                    <label>Enter URL:</label>
                    <input type="text" value={selectedValue}></input>
                    <input type="submit" value="Go" />
                </form> */}
            </>
        )
    }
    return <></>;
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
            <BrowserDialog open={open} onClose={handleClose} />
        </>
    );
}

export default BrowserButton;












// import React from 'react';
// import Button from '@material-ui/core/Button';
// import { useDispatch } from 'react-redux';
// import { Metafile, Card } from '../types';
// import { v4 } from 'uuid';
// import { DateTime } from 'luxon';
// import { Actions, ActionKeys } from '../store/actions';

// type browserDialogProps = {
//     thisIsDumb: () => void;
// }

// const BrowserDialog: React.FunctionComponent<browserDialogProps> = props => {
//     const text = "Hello world";
//     props.thisIsDumb();

//     return (
//         <div>{text}</div>
//     )
// }

// const BrowserButton: React.FunctionComponent = () => {
//     const dispatch = useDispatch();

//     const handleClick = async (e: React.MouseEvent) => {
//         e.preventDefault();
//     }

//     const metafile: Metafile = {
//         id: v4(),
//         name: "Something?",
//         modified: DateTime.local(),
//         handler: "Browser"
//     }

//     const thisIsDumb = () => {
//         const addMetafileAction: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
//         dispatch(addMetafileAction);

//         const card: Card = {
//             id: v4(),
//             name: metafile.name,
//             type: 'Browser',
//             related: [],
//             created: DateTime.local(),
//             modified: DateTime.local(),
//             captured: false,
//             left: 50,
//             top: 50
//         }

//         const addCardAction: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
//         dispatch(addCardAction);
//     };

//     return (
//         <>
//             <Button id='filepicker-button' variant='contained' color='primary' onClick={async (e) => { await handleClick(e) }}>Open Browser...</Button>
//             <BrowserDialog thisIsDumb={thisIsDumb} />
//         </>
//     )
// }
// export default BrowserButton;