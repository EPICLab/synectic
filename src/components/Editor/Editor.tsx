import React, { useState, useEffect } from 'react';
import 'ace-builds';
import AceEditor from 'react-ace';
/* webpack-resolver incorrectly resolves basePath for file-loader unless at least one mode has already been loaded, 
thus the following javascript mode file is loaded to fix this bug */
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/webpack-resolver'; // resolver for dynamically loading modes, requires webpack file-loader module
import metafileSelectors from '../../store/selectors/metafiles';
import { metafileUpdated } from '../../store/slices/metafiles';
import { getConflictingChunks, getRandomInt, isDefined, removeUndefinedProperties } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { UUID } from '../../store/types';
import { isHydrated } from '../../store/thunks/metafiles';
import { Skeleton } from '@material-ui/lab';

const Editor = ({ metafileId: id, expanded = false }: { metafileId: UUID, expanded?: boolean }) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const [editorRef] = useState(React.createRef<AceEditor>());
  const mode = removeUndefinedProperties({ mode: metafile?.filetype?.toLowerCase() });
  const [code, setCode] = useState(metafile && metafile.content ? metafile.content : '');
  const skeletonWidth = getRandomInt(55, 90);
  const dispatch = useAppDispatch();

  useEffect(() => (metafile && metafile.content) ? setCode(metafile.content) : undefined, [metafile]);
  useEffect(() => editorRef.current?.editor.resize(), [editorRef, expanded]);

  const onChange = async (newCode: string | undefined) => {
    setCode(newCode ?? '');
    const conflicts = getConflictingChunks(newCode ?? '');

    if (metafile) {
      dispatch(metafileUpdated({
        ...metafile,
        content: newCode ?? '',
        state: newCode !== metafile.content ? 'modified' : 'unmodified',
        conflicts: conflicts
      }));
    }
  };

  return (
    <>
      {isDefined(metafile) && isHydrated(metafile) ?
        <AceEditor {...mode} theme='monokai' onChange={onChange} name={id + '-editor'} value={code}
          ref={editorRef} className='editor' height='100%' width='100%' showGutter={expanded} focus={false}
          setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
        : <Skeleton variant='text' aria-label='loading' width={`${skeletonWidth}%`} />}
    </>
  );
}

export default Editor;