import React, { Component } from 'react';

//Tree Node type definition:
type tNode = {
  path: string;
  type: string;
  isRoot: boolean;
  content: string;
  children: string[];
}

//Dummy data:
const root: tNode = {
  path: '/root',
  type: 'folder',
  isRoot: true,
  content: '',
  children: ['/root/boop.txt', '/root/beep.txt', '/root/foo'],
}

const file1: tNode = {
  path: '/root/boop.txt',
  type: 'file',
  isRoot: false,
  content: 'ABC',
  children: [],
}

const file2: tNode = {
  path: '/root/boop.txt',
  type: 'file',
  isRoot: false,
  content: 'DEF',
  children: [],
}

const folder1: tNode = {
  path: '/root/foo',
  type: 'folder',
  isRoot: false,
  content: '',
  children: [],
}

//Put the data into an array
const data = [
  root,
  file1,
  file2,
  folder1,
]

const getNodeLabel = (node: tNode) => node.path.split('/').slice(-1)[0]; // returns last segment of the path

//Individual file/folder component:
const TreeNode = (props: { node: tNode; getChildNodes: any /*level: number;*/ }) => {
  const { node, getChildNodes, /*level*/ } = props;

  return (
    <React.Fragment>
      <div>
        <div>
          {node.type === 'folder'}
        </div>

        <div>
          {node.type === 'file'}
          {node.type === 'folder'}
          {node.type === 'folder'}
        </div>

        <span role="button">
          {getNodeLabel(node)}
        </span>
      </div>
      {getChildNodes(node).map((childNode: any, index: number) => (
        <TreeNode
          key={index}
          {...props}
          node={childNode}
        //level={level + 1}
        />
      ))}
    </React.Fragment>
  );
}

//File/folder tree component:
export default class Tree extends Component {

  state = {
    nodes: data,
  };

  getRootNodes = () => {
    const { nodes } = this.state;
    return Object.values(nodes).filter((node: any) => node.isRoot === true);
  }

  getChildNodes = (node: tNode) => {
    if (!node.children) return [];
    return node.children.map(() => node.path);
  }

  render = () => {
    const rootNodes = this.getRootNodes();
    return (
      <div>
        {rootNodes.map((node: tNode, index: number) => (
          <TreeNode
            key={index}
            node={node}
            getChildNodes={this.getChildNodes}
          />
        ))}
      </div>
    )
  }
}