// import { Browser } from '../types';
// import { ActionKeys } from '../store/actions';
import { UUID } from '../types';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/root';

// const myMetafile: Metafile = {
//     id: "hello",
//     name: "Website Title",
//     modified: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
//     handler: "Browser"
// }

const BrowserComponent: React.FunctionComponent<{ metafileId: UUID }> = props => {
    const metafile = useSelector((state: RootState) => state.metafiles[props.metafileId]);

    return (
        <div>
            {metafile.id}
        </div>
    )
}

export default BrowserComponent;

// const openBrowser = async (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    //     e.preventDefault();
    //     window.open('https://www.github.com', '_blank');
    //     alert('I have been clicked!');
    // }

// const OpenBrowser: React.FunctionComponent = () => {
//     const WebView = require('react-electron-web-view');

//     return (
//         <WebView src="https://www.google.com" />
//     )
// }