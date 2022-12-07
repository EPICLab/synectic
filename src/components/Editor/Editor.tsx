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

type EditorProps = {
  metafileId: UUID,
  expanded?: boolean
};

/**
 * React Component to display an interactive editor for the content of a specific file. Virtual files can be
 * loaded into this component.
 * 
 * @param props - Prop object for editable content in a specific file.
 * @param props.metafileId - The UUID for the metafile used to represent the contents of this component.
 * @param props.expanded - An optional toggle for enabling fullscreen mode in the editor; defaults to false.
 * @returns {React.Component} A React function component.
 */
const Editor = ({ metafileId: id, expanded = false }: EditorProps) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const [editorRef] = useState(React.createRef<AceEditor>());
  const mode = removeUndefinedProperties({ mode: metafile?.filetype?.toLowerCase() });
  const skeletonWidth = getRandomInt(55, 90);
  const dispatch = useAppDispatch();

  useEffect(() => editorRef.current?.editor.resize(), [editorRef, expanded]);

  const onChange = async (newCode: string | undefined) => {
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
        <AceEditor {...mode} theme='monokai' onChange={onChange} name={id + '-editor'} value={metafile.content ?? ''}
          ref={editorRef} className='editor' height='100%' width='100%' showGutter={expanded} focus={false}
          setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
        : <Skeleton variant='text' aria-label='loading' width={`${skeletonWidth}%`} />}
    </>
  );
};

export default Editor;