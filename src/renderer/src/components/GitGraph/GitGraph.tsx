import { BlurCircular, LocationSearching } from '@mui/icons-material';
import { TextField, Typography, styled } from '@mui/material';
import layoutGraph from '@renderer/containers/graph-layout';
import { useCallback, useEffect, useState, KeyboardEvent } from 'react';
import ReactFlow, {
  Connection,
  ControlButton,
  Controls,
  Edge,
  Node,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  ReactFlowProvider,
  addEdge,
  isEdge,
  isNode,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStoreApi
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { UUID } from 'types/app';
import { BranchLookup, CommitGraph, useGitGraph } from '../../containers/hooks/useGitGraph';
import useToggle from '../../containers/hooks/useToggle';
import { nodeTypes } from './GitNode';

const Flow = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  graph,
  branchLookup,
  printGraph,
  calculateLayout
}: {
  nodes: Node<any, string | undefined>[];
  edges: Edge<any>[] | undefined;
  onNodesChange: OnNodesChange | undefined;
  onEdgesChange: OnEdgesChange | undefined;
  onConnect: OnConnect | undefined;
  graph: CommitGraph;
  branchLookup: BranchLookup;
  printGraph: () => void;
  calculateLayout: () => void;
}) => {
  const store = useStoreApi();
  const reactFlowInstance = useReactFlow();

  const [searchText, setSearchText] = useState('');
  const [isSearchExpanded, toggleSearchExpanded] = useToggle(false);
  const [isSearchValid, toggleSearchValid] = useToggle(true);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const branchOid = branchLookup.get(searchText);
      const vertex =
        branchOid && graph.has(branchOid) ? graph.get(branchOid) : graph.get(searchText);

      if (vertex) {
        const { nodeInternals } = store.getState();
        const node = Array.from(nodeInternals).find(([id]) => id === vertex.oid.toString())?.[1];

        if (node) {
          const x = node.position.x + (node.width ?? 0) / 2;
          const y = node.position.y + (node.height ?? 0) / 2;
          const zoom = 1.85;

          toggleSearchValid(true);
          store.getState().addSelectedNodes([node.id]);
          reactFlowInstance.setCenter(x, y, { zoom, duration: 1000 });
          toggleSearchExpanded();
        }
      } else {
        toggleSearchValid(false);
        store.getState().unselectNodesAndEdges();
        reactFlowInstance.fitView({ duration: 1000 });
      }
    }
  };

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        style={{ zIndex: 0 }}
        fitView
      >
        <Controls showInteractive={false} onFitView={calculateLayout}>
          <HorizontalBox>
            <ControlButton
              onClick={() => toggleSearchExpanded()}
              style={{ backgroundColor: isSearchExpanded ? '#DCDCDC' : undefined }}
              title="search"
            >
              <LocationSearching style={{ maxWidth: 16, maxHeight: 16 }} />
            </ControlButton>
            {isSearchExpanded ? (
              <SearchTextField
                hiddenLabel
                value={searchText}
                error={!isSearchValid}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={e => handleKeyDown(e)}
                placeholder="commit oid"
              />
            ) : null}
          </HorizontalBox>
          <ControlButton onClick={printGraph} title="expose graph">
            <BlurCircular style={{ maxWidth: 16, maxHeight: 16 }} />
          </ControlButton>
        </Controls>
        <Typography sx={{ pl: 1, pr: 1, position: 'absolute', bottom: 0, right: 60, fontSize: 12 }}>
          Nodes: {nodes.length}, Edges: {edges?.length}
        </Typography>
      </ReactFlow>
    </>
  );
};

const HorizontalBox = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  borderRadius: '0 4px 4px 0'
});

const SearchTextField = styled(TextField)(({ theme }) => ({
  borderRadius: '0 4px 4px 0',
  width: 385,
  '& label.Mui-focused': {
    color: '#A0AAB4'
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: '#B2BAC2'
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: '0 4px 4px 0',
    height: '100%',
    '& input': {
      backgroundColor: theme.palette.background.paper,
      borderRadius: '0 4px 4px 0',
      height: '100%',
      padding: '0 5px'
    }
  }
}));

const GitGraph = ({ repo }: { repo: UUID }) => {
  const { graph, topological, branchLookup, printGraph } = useGitGraph(repo);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  const calculateLayout = useCallback(() => {
    const rfElements = layoutGraph(graph, topological);
    setNodes(rfElements.filter(isNode));
    setEdges(rfElements.filter(isEdge));
  }, [graph, setEdges, setNodes, topological]);

  useEffect(() => {
    calculateLayout();
  }, [calculateLayout, graph, topological]);

  return (
    <ReactFlowProvider>
      <Flow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        graph={graph}
        branchLookup={branchLookup}
        printGraph={printGraph}
        calculateLayout={calculateLayout}
      />
    </ReactFlowProvider>
  );
};

export default GitGraph;
