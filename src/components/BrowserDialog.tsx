import React from 'react';
// import { Browser } from '../types';
// import { ActionKeys } from '../store/actions';
// import { UUID } from '../types';
import Button from '@material-ui/core/Button';
import { Metafile } from '../types';
import { DateTime } from 'luxon';
import { useDispatch } from 'react-redux';
import { loadCard } from '../containers/handlers';


const myMetafile: Metafile = {
    id: "hello",
    name: "Website Title",
    modified: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
    handler: "Browser"
}


// const OpenBrowser: React.FunctionComponent = () => {
//     const WebView = require('react-electron-web-view');

//     return (
//         <WebView src="https://www.google.com" />
//     )
// }

const BrowserComponent: React.FunctionComponent = () => {
    // const openBrowser = async (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    //     e.preventDefault();
    //     window.open('https://www.github.com', '_blank');
    //     alert('I have been clicked!');
    // }

    const dispatch = useDispatch();

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        // const stuff = loadCard(myMetafile);
        // alert(`${stuff}`);
        dispatch(loadCard(myMetafile));
    }

    return (
        <div>
            <Button id='filepicker-button' variant='contained' color='primary' onClick={async (e) => { await handleClick(e) }}>Browser</Button>
            {/* <OpenBrowser /> */}
        </div>
    )
}
export default BrowserComponent;