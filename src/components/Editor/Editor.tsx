import React, { useState, useEffect } from 'react';
import 'ace-builds';
import AceEditor, { IAceEditorProps } from 'react-ace';
/* webpack-resolver incorrectly resolves basePath for file-loader unless at least one mode has already been loaded, 
thus the following javascript mode file is loaded to fix this bug */
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/webpack-resolver'; // resolver for dynamically loading modes, requires webpack file-loader module
import metafileSelectors from '../../store/selectors/metafiles';
import { Metafile, metafileUpdated } from '../../store/slices/metafiles';
import {
  // getConflictingChunks,
  getRandomInt,
  isDefined,
  removeNullableProperties
} from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { UUID } from '../../store/types';
import './EditorStyles.css';
import { Skeleton } from '@mui/material';

/**
 * React Component to display an interactive editor for the content of a specific file. Virtual files can be
 * loaded into this component.
 * @param props - Prop object for editable content in a specific file.
 * @param props.id - The UUID for the metafile used to represent the contents of this component.
 * @param props.expanded - An optional toggle for enabling fullscreen mode in the editor; defaults to false.
 * @returns {React.Component} A React function component.
 */
const Editor = ({ id, expanded = false }: { id: UUID; expanded?: boolean }) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const [editorRef] = useState(React.createRef<AceEditor>());
  const mode = removeNullableProperties({ mode: metafile?.filetype?.toLowerCase() });
  const skeletonWidth = getRandomInt(55, 90);
  const dispatch = useAppDispatch();

  // AceEditor instance requires resizing when card is expanded
  useEffect(() => editorRef.current?.editor.resize(), [editorRef, expanded]);

  const onChange = async (newCode: string | undefined) => {
    // const conflicts = getConflictingChunks(newCode ?? '');

    if (metafile) {
      dispatch(
        metafileUpdated({
          ...metafile,
          content: newCode ?? '',
          state: newCode !== metafile.content ? 'modified' : 'unmodified'
          // conflicts: conflicts
        })
      );
    }
  };

  return (
    <>
      {isEditorMetafile(metafile) ? (
        <AceEditor
          {...mode}
          {...editorProps}
          name={id + '-editor'}
          ref={editorRef}
          value={metafile.content}
          showGutter={expanded}
          onChange={onChange}
        />
      ) : (
        <Skeleton variant="text" aria-label="loading" width={`${skeletonWidth}%`} />
      )}
    </>
  );
};

const editorProps: IAceEditorProps = {
  className: 'editor',
  theme: 'monokai',
  height: '100%',
  width: '100%',
  focus: false,
  setOptions: {
    useWorker: false,
    selectionStyle: 'text',
    autoScrollEditorIntoView: true,
    hScrollBarAlwaysVisible: false,
    vScrollBarAlwaysVisible: false
  }
};

const isEditorMetafile = (metafile: Metafile | undefined): metafile is Metafile => {
  return isDefined(metafile) && metafile.filetype !== 'Directory' && metafile.content !== undefined;
};

export default Editor;
