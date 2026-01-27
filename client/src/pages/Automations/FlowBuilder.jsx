import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, ArrowLeft, Play, Plus } from 'lucide-react';

// Custom Nodes (We'll implement these next)
// import MessageNode from '../../components/Flow/nodes/MessageNode';
// import StartNode from '../../components/Flow/nodes/StartNode';

const nodeTypes = {
    // message: MessageNode,
    // start: StartNode
};

export default function FlowBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [flowName, setFlowName] = useState('Untitled Flow');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isNew) {
            fetchFlow();
        } else {
            // Initial state for new flow
            setNodes([
                {
                    id: 'start-1',
                    type: 'input', // using default type for now
                    data: { label: 'Start Trigger' },
                    position: { x: 250, y: 50 },
                    deletable: false
                }
            ]);
        }
    }, [id]);

    const fetchFlow = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/flows/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setFlowName(data.name);

            if (data.content && data.content.nodes) {
                setNodes(data.content.nodes);
                setEdges(data.content.edges);
            }
        } catch (err) {
            console.error('Failed to load flow', err);
        }
    };

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

    const saveFlow = async () => {
        setSaving(true);
        const flowData = {
            name: flowName,
            content: { nodes, edges },
            triggerType: 'NEW_CONTACT' // Default for now
        };

        try {
            const url = isNew ? 'http://localhost:3000/api/flows' : `http://localhost:3000/api/flows/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(flowData)
            });

            const data = await res.json();
            if (isNew) {
                navigate(`/automations/${data.id}`);
            }
            // alert('Flow saved!');
        } catch (err) {
            console.error('Failed to save flow', err);
        } finally {
            setSaving(false);
        }
    };

    const addNode = (type) => {
        const id = `${type}-${Date.now()}`;
        const newNode = {
            id,
            type: 'default', // Using default for now until custom nodes are ready
            data: { label: `New ${type} node` },
            position: { x: 250, y: nodes.length * 100 + 100 }
        };
        setNodes((nds) => nds.concat(newNode));
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900">
            {/* Header */}
            <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/automations')} className="text-gray-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        type="text"
                        value={flowName}
                        onChange={(e) => setFlowName(e.target.value)}
                        className="bg-transparent text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={saveFlow}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Flow'}
                    </button>
                </div>
            </div>

            {/* Flow Canvas */}
            <div className="flex-1 w-full h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-gray-950"
                >
                    <Background color="#374151" gap={16} />
                    <Controls className="bg-gray-800 border-gray-700 fill-white text-white" />

                    <Panel position="top-left" className="bg-gray-800 p-2 rounded-lg border border-gray-700 shadow-xl flex gap-2">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-2 w-full text-center hidden">Add Node</div>
                        <button onClick={() => addNode('message')} className="p-2 hover:bg-gray-700 rounded text-gray-300 flex flex-col items-center gap-1 text-xs">
                            <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            Message
                        </button>
                        <button onClick={() => addNode('delay')} className="p-2 hover:bg-gray-700 rounded text-gray-300 flex flex-col items-center gap-1 text-xs">
                            <div className="w-8 h-8 rounded bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            Delay
                        </button>
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
}
