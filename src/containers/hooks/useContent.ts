import { PathLike } from 'fs-extra';
import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { metafileUpdated } from '../../store/slices/metafiles';
import { fetchMetafile } from '../../store/thunks/metafiles';
import type { Metafile } from '../../types';
import useGitWatcher from './useGitWatcher';
import { WatchEventType } from './useWatcher';

export type useFileContentHook = {
    content: string,
    fileContent: string,
    update: (newContent: string | undefined) => Promise<void>
}

/**
 * Custom React Hook for monitoring for divergences between loaded content (i.e. from Metafile.content field) and the underlying file. The cached
 * version of the file content allows for IO-based operations to be conserved.
 * @param metafile 
 * @returns 
 */
const useContent = (metafile: Metafile): useFileContentHook => {
    const dispatch = useAppDispatch();
    const [content, setContent] = useState(metafile.content ? metafile.content : '');
    const [fileContent, setFileContent] = useState(metafile.content ? metafile.content : '');
    const eventHandler = async (event: WatchEventType, filename: PathLike) => fileUpdate(event, filename);
    useGitWatcher(metafile.path, eventHandler);

    const fileUpdate = async (event: WatchEventType, filename: PathLike) => {
        if (event === 'change') {
            const metafile = await dispatch(fetchMetafile({ filepath: filename })).unwrap();
            if (metafile.content) {
                setFileContent(metafile.content);
                if (metafile.content === fileContent) {
                    dispatch(metafileUpdated({ ...metafile, state: 'unmodified' }));
                } else {
                    dispatch(metafileUpdated({ ...metafile, state: 'modified' }));
                }
            }
        }
    }

    const update = async (newContent: string | undefined) => {
        if (newContent && newContent !== content) {
            if (newContent === fileContent) {
                dispatch(metafileUpdated({ ...metafile, content: newContent, state: 'unmodified' }));
            } else {
                dispatch(metafileUpdated({ ...metafile, content: newContent, state: 'modified' }));
            }
            setContent(newContent);
        }
    }

    return { content: content, fileContent: fileContent, update };
}

export default useContent;