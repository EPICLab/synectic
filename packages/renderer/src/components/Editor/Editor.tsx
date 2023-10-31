import {Skeleton} from '@mui/material';
import type {UUID} from '@syn-types/app';
import type {Metafile} from '@syn-types/metafile';
import 'ace-builds/src-noconflict/ace';
import React, {useEffect, useState} from 'react';
import './EditorStyles.css';
// resolver for dynamically loading modes, per https://github.com/mkslanc/ace-samples/blob/main/samples/ace-builds-vitejs/src/index.jsimport
import {getRandomInt, isDefined} from '#preload';
import 'ace-builds/esm-resolver';
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/theme-monokai';
import AceEditor, {type IAceEditorProps} from 'react-ace';
import {useAppDispatch, useAppSelector} from '/@/store/hooks';
import metafileSelectors from '/@/store/selectors/metafiles';
import {metafileUpdated} from '/@/store/slices/metafiles';

/**
 * React Component to display an interactive editor for the content of a specific file. Virtual files can be
 * loaded into this component.
 * @param props - Prop object for editable content in a specific file.
 * @param props.id - The UUID for the metafile used to represent the contents of this component.
 * @param props.expanded - An optional toggle for enabling fullscreen mode in the editor; defaults to false.
 * @returns {React.Component} A React function component.
 */
const Editor = ({id, expanded = false}: {id: UUID; expanded?: boolean}) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const [editorRef] = useState(React.createRef<AceEditor>());
  const mode = metafile?.filetype?.toLowerCase() ?? 'text';
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
          state: newCode !== metafile.content ? 'modified' : 'unmodified',
          // conflicts: conflicts
        }),
      );
    }
  };

  return (
    <>
      {isEditorMetafile(metafile) ? (
        <AceEditor
          {...editorProps}
          name={id + '-editor'}
          ref={editorRef}
          value={metafile.content ?? ''}
          mode={mode}
          showGutter={expanded}
          onChange={onChange}
        />
      ) : (
        <Skeleton
          variant="text"
          aria-label="loading"
          width={`${skeletonWidth}%`}
        />
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
    vScrollBarAlwaysVisible: false,
  },
};

const isEditorMetafile = (metafile: Metafile | undefined): metafile is Metafile => {
  return isDefined(metafile) && metafile.filetype !== 'Directory' && metafile.content !== undefined;
};

export default Editor;
