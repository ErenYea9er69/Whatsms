import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
    MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Save, ArrowLeft, Play, Pause, MessageSquare, Clock,
    GitBranch, UserPlus, Webhook, FormInput, Zap,
    Trash2, Copy, Settings2, ChevronDown
} from 'lucide-react';

// Custom Nodes
import TriggerNode from '../../components/Flow/nodes/TriggerNode';
import MessageNode from '../../components/Flow/nodes/MessageNode';
import DelayNode from '../../components/Flow/nodes/DelayNode';
import ConditionNode from '../../components/Flow/nodes/ConditionNode';
import AssignNode from '../../components/Flow/nodes/AssignNode';
import WebhookNode from '../../components/Flow/nodes/WebhookNode';
import CollectInputNode from '../../components/Flow/nodes/CollectInputNode';

const nodeTypes = {
    trigger: TriggerNode,
    message: MessageNode,
    delay: DelayNode,
    condition: ConditionNode,
    assign: AssignNode,
    webhook: WebhookNode,
    collectInput: CollectInputNode,
};

const nodeCategories = [
    {
        name: 'Triggers',
        items: [
            { type: 'trigger', icon: Zap, label: 'Start Trigger', color: 'emerald' }
        ]
    },
    {
        name: 'Actions',
        items: [
            { type: 'message', icon: MessageSquare, label: 'Send Message', color: 'blue' },
            { type: 'delay', icon: Clock, label: 'Wait/Delay', color: 'yellow' },
            { type: 'collectInput', icon: FormInput, label: 'Collect Input', color: 'orange' },
            { type: 'assign', icon: UserPlus, label: 'Assign Agent', color: 'pink' },
            { type: 'webhook', icon: Webhook, label: 'Webhook', color: 'teal' },
        ]
    },
    {
        name: 'Logic',
        items: [
            { type: 'condition', icon: GitBranch, label: 'Condition', color: 'purple' },
        ]
    }
];

const triggerOptions = [
    { value: 'NEW_CONTACT', label: 'New Contact Added' },
    { value: 'KEYWORD', label: 'Keyword Match' },
    { value: 'NO_REPLY', label: 'No Reply After...' },
    { value: 'WEBHOOK', label: 'Webhook Event' },
    { value: 'SCHEDULE', label: 'Scheduled Time' },
];

export default function FlowBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';
    const reactFlowWrapper = useRef(null);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [flowName, setFlowName] = useState('Untitled Flow');
    const [flowDescription, setFlowDescription] = useState('');
    const [triggerType, setTriggerType] = useState('NEW_CONTACT');
    const [triggerKeyword, setTriggerKeyword] = useState('');
    const [saving, setSaving] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (!isNew) {
            fetchFlow();
        } else {
            // Initial state for new flow with styled trigger
            setNodes([
                {
                    id: 'trigger-1',
                    type: 'trigger',
                    data: { label: 'New Contact Added', triggerType: 'NEW_CONTACT' },
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
            setFlowDescription(data.description || '');
            setTriggerType(data.triggerType || 'NEW_CONTACT');
            setTriggerKeyword(data.triggerKeyword || '');
            setIsActive(data.isActive);

            if (data.content && data.content.nodes) {
                setNodes(data.content.nodes);
                setEdges(data.content.edges || []);
            }
        } catch (err) {
            console.error('Failed to load flow', err);
        }
    };

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({
            ...params,
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 }
        }, eds));
    }, []);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);

    const saveFlow = async () => {
        setSaving(true);
        const flowData = {
            name: flowName,
            description: flowDescription,
            content: { nodes, edges },
            triggerType,
            triggerKeyword: triggerType === 'KEYWORD' ? triggerKeyword : null,
            isActive
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
                navigate(`/automations/${data.id}`, { replace: true });
            }
        } catch (err) {
            console.error('Failed to save flow', err);
        } finally {
            setSaving(false);
        }
    };

    const addNode = (type) => {
        const nodeId = `${type}-${Date.now()}`;
        const labels = {
            trigger: 'New Trigger',
            message: 'Send Message',
            delay: 'Wait 1 hour',
            condition: 'Check Condition',
            assign: 'Assign to Agent',
            webhook: 'Call Webhook',
            collectInput: 'Collect User Input'
        };

        const newNode = {
            id: nodeId,
            type,
            data: { label: labels[type] || 'New Node' },
            position: { x: 250, y: nodes.length * 120 + 100 }
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const deleteSelectedNode = () => {
        if (selectedNode && selectedNode.deletable !== false) {
            setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
            setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
            setSelectedNode(null);
        }
    };

    const duplicateSelectedNode = () => {
        if (selectedNode) {
            const newNode = {
                ...selectedNode,
                id: `${selectedNode.type}-${Date.now()}`,
                position: {
                    x: selectedNode.position.x + 50,
                    y: selectedNode.position.y + 50
                }
            };
            setNodes((nds) => nds.concat(newNode));
        }
    };

    const toggleActive = async () => {
        const newStatus = !isActive;
        setIsActive(newStatus);

        if (!isNew) {
            try {
                await fetch(`http://localhost:3000/api/flows/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ isActive: newStatus })
                });
            } catch (err) {
                console.error('Failed to toggle status', err);
                setIsActive(!newStatus);
            }
        }
    };

    return (
        <div className="h-screen flex bg-gray-950">
            {/* Left Sidebar - Node Palette */}
            <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                    <button
                        onClick={() => navigate('/automations')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4"
                    >
                        <ArrowLeft size={16} />
                        Back to Automations
                    </button>
                    <input
                        type="text"
                        value={flowName}
                        onChange={(e) => setFlowName(e.target.value)}
                        className="w-full bg-gray-800 text-white font-semibold text-lg px-3 py-2 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none"
                        placeholder="Flow name..."
                    />
                </div>

                {/* Node Palette */}
                <div className="flex-1 overflow-y-auto p-4">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-3">Drag to add nodes</p>

                    {nodeCategories.map((category) => (
                        <div key={category.name} className="mb-6">
                            <h3 className="text-xs text-gray-400 font-semibold mb-2">{category.name}</h3>
                            <div className="space-y-2">
                                {category.items.map((item) => (
                                    <button
                                        key={item.type}
                                        onClick={() => addNode(item.type)}
                                        className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left group"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${item.color}-500/20`}
                                            style={{ backgroundColor: `var(--${item.color}-bg, rgba(99, 102, 241, 0.2))` }}>
                                            <item.icon size={20} className={`text-${item.color}-400`} style={{ color: `var(--${item.color}-text, #818cf8)` }} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{item.label}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Flow Settings */}
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Settings2 size={16} />
                            Flow Settings
                        </div>
                        <ChevronDown size={16} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                    </button>

                    {showSettings && (
                        <div className="mt-3 space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Trigger Type</label>
                                <select
                                    value={triggerType}
                                    onChange={(e) => setTriggerType(e.target.value)}
                                    className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700"
                                >
                                    {triggerOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {triggerType === 'KEYWORD' && (
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Keyword</label>
                                    <input
                                        type="text"
                                        value={triggerKeyword}
                                        onChange={(e) => setTriggerKeyword(e.target.value)}
                                        placeholder="e.g., hello, pricing"
                                        className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                            {isActive ? 'Active' : 'Inactive'}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleActive}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                }`}
                        >
                            {isActive ? <Pause size={16} /> : <Play size={16} />}
                            {isActive ? 'Pause Flow' : 'Activate Flow'}
                        </button>

                        <button
                            onClick={saveFlow}
                            disabled={saving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* React Flow Canvas */}
                <div className="flex-1" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-gray-950"
                        defaultEdgeOptions={{
                            animated: true,
                            style: { stroke: '#6366f1', strokeWidth: 2 }
                        }}
                    >
                        <Background color="#374151" gap={20} size={1} />
                        <Controls className="!bg-gray-800 !border-gray-700 !rounded-lg [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-white [&>button:hover]:!bg-gray-700" />
                        <MiniMap
                            nodeColor={(node) => {
                                const colors = {
                                    trigger: '#10b981',
                                    message: '#3b82f6',
                                    delay: '#eab308',
                                    condition: '#a855f7',
                                    assign: '#ec4899',
                                    webhook: '#14b8a6',
                                    collectInput: '#f97316'
                                };
                                return colors[node.type] || '#6366f1';
                            }}
                            className="!bg-gray-800 !border-gray-700"
                            maskColor="rgba(0,0,0,0.8)"
                        />

                        {/* Selected Node Actions */}
                        {selectedNode && (
                            <Panel position="top-right" className="bg-gray-800 p-2 rounded-lg border border-gray-700 flex gap-2">
                                <button
                                    onClick={duplicateSelectedNode}
                                    className="p-2 hover:bg-gray-700 rounded text-gray-300"
                                    title="Duplicate"
                                >
                                    <Copy size={16} />
                                </button>
                                {selectedNode.deletable !== false && (
                                    <button
                                        onClick={deleteSelectedNode}
                                        className="p-2 hover:bg-red-500/20 rounded text-red-400"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </Panel>
                        )}
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}
