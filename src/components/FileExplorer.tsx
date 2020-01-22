import React, { useState, useEffect } from 'react';
import { generateFileTreeObject, TreeNode } from '../containers/explorer';

interface FileTreeProps {
  path: string;
}

export const FileTreeComponent: React.FunctionComponent<FileTreeProps> = (props: FileTreeProps) => {
  const [files, setFiles] = useState<string[]>([props.path]);
  const [nodes, setNodes] = useState<TreeNode[]>([]);

  useEffect(() => {
    async function fetchData() {
      generateFileTreeObject(props.path)
        .then((result) => {
          setNodes(result);
        });
    }

    fetchData();
  }, [props.path]);

  return (
    <>
      <button onClick={() => setFiles(["You clicked the button", "How neat is that?"])}></button>
      <ul>
        {files.map((f, i) => <li key={i}>{f}</li>)}
        Path: {files}
        Nodes: {nodes.map((node, i) => <li key={i}>{node.filePath}</li>)}
      </ul>
    </>
  );
}

/**
 *       {files.map((file: TreeNode) => {
        {
          file.isFileBool ?
            <li key={file.filePath + ' Directory'}>{`${io.extractFilename(file.filePath)}`}
              <Component<TreeNode> filePath={file.filePath} files={file.files} isFileBool={file.isFileBool} />}
           </li>
            :
            <li key={file.filePath}>{`${io.extractFilename(file.filePath)}`}</li>;
        }
      })
      }
 */