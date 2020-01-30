import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/root';
import { UUID } from '../types';
import 'ace-builds';
import { diff as DiffEditor } from "react-ace";
import 'ace-builds/src-noconflict/theme-monokai';

const Diff: React.FunctionComponent<{ left: UUID; right: UUID }> = props => {
  const leftMetafile = useSelector((state: RootState) => state.metafiles[props.left]);
  const rightMetafile = useSelector((state: RootState) => state.metafiles[props.right]);
  const leftContent = leftMetafile.content ? leftMetafile.content : '';
  const rightContent = rightMetafile.content ? rightMetafile.content : '';

  return (
    <DiffEditor mode={leftMetafile.filetype} theme='monokai' value={[leftContent, rightContent]}
      height="100%" width="100%" />
  );
}

export default Diff;