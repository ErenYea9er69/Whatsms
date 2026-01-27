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
    Save, ArrowLeft, Play, Pause,
    FileText, Image, MousePointerClick, List, LayoutTemplate,
    Users, UserMinus, Tag, Hash, Layout, Trash2, Clock,
    ChevronDown, ChevronRight
} from 'lucide-react';

// Custom Nodes
import TriggerNode from '../../components/Flow/nodes/TriggerNode';
import GenericNode from '../../components/Flow/nodes/GenericNode';
import ConditionNode from '../../components/Flow/nodes/ConditionNode';

const nodeTypes = {
    trigger: TriggerNode,
    condition: ConditionNode,
    action: GenericNode,
};

// Sidebar Categories configuration
const sidebarCategories = [
    {
        id: 'messages',
        title: 'Messages',
        items: [
            { id: 'text', label: 'Simple text', icon: FileText, subType: 'text' },
            { id: 'media', label: 'Media files', icon: Image, subType: 'media' },
            { id: 'buttons', label: 'Interactive buttons', icon: MousePointerClick, subType: 'buttons' },
            { id: 'list', label: 'Interactive list', icon: List, subType: 'list' },
            { id: 'template', label: 'Template', icon: LayoutTemplate, subType: 'template' },
        ]
    },
    {
        id: 'groups',
        title: 'Group Actions',
        items: [
            { id: 'addGroup', label: 'Add to group', icon: Users, subType: 'addGroup' },
            { id: 'removeGroup', label: 'Remove from Group', icon: UserMinus, subType: 'removeGroup' },
        ]
    },
    {
        id: 'tags',
        title: 'Tag',
        items: [
            { id: 'addTag', label: 'Add Tags', icon: Tag, subType: 'addTag' },
            { id: 'removeTag', label: 'Remove Tags', icon: Hash, subType: 'removeTag' },
        ]
    },
    {
        id: 'funnel',
        title: 'Funnel',
        items: [
            { id: 'addPipeline', label: 'Add/Edit to Pipeline', icon: Layout, subType: 'addPipeline' },
            { id: 'removePipeline', label: 'Remove from Pipeline', icon: Trash2, subType: 'removePipeline' },
        ]
    },
    {
        id: 'others',
        title: 'Others',
        items: [
            { id: 'delay', label: 'Delay', icon: Clock, subType: 'delay' },
        ]
    }
];

const triggerOptions = [
    { value: 'NEW_CONVERSATION', label: 'New conversation' },
    { value: 'KEYWORDS', label: 'Text contains specific keywords' },
    { value: 'HAS_TAGS', label: 'Contact has specific tags' },
    { value: 'PIPELINE_UPDATE', label: 'Contact has been affected to a pipeline' },
    { value: 'SHORT_RESPONSE', label: 'Advanced Short response' },
];

export default function FlowBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';
    const reactFlowWrapper = useRef(null);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Flow State
    const [flowName, setFlowName] = useState('Untitled Flow');
    const [triggerType, setTriggerType] = useState('NEW_CONVERSATION');
    const [triggerData, setTriggerData] = useState({});
    const [isActive, setIsActive] = useState(false);

    // UI State
    const [saving, setSaving] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({
        messages: true,
        groups: true,
        tags: true,
        funnel: false,
        others: true
    });
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        if (!isNew) {
            fetchFlow();
        } else {
            setNodes([
                {
                    id: 'trigger-1',
                    type: 'trigger',
                    data: { triggerType: 'NEW_CONVERSATION' },
                    position: { x: 100, y: 300 },
                    deletable: false,
                }
            ]);
        }
    }, [id]);

    useEffect(() => {
        setNodes(nds => nds.map(node => {
            if (node.type === 'trigger') {
                return { ...node, data: { ...node.data, triggerType, ...triggerData } };
            }
            return node;
        }));
    }, [triggerType, triggerData, setNodes]);

    const fetchFlow = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/flows/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setFlowName(data.name);
            setTriggerType(data.triggerType || 'NEW_CONVERSATION');
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
            style: { stroke: '#94a3b8', strokeWidth: 2 }
        }, eds));
    }, [setEdges]);

    const saveFlow = async () => {
        setSaving(true);
        const flowData = {
            name: flowName,
            content: { nodes, edges },
            triggerType,
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
            if (isNew) navigate(`/automations/${data.id}`, { replace: true });
        } catch (err) {
            console.error('Failed to save', err);
        } finally {
            setSaving(false);
        }
    };

    const addNode = (item) => {
        const newNode = {
            id: `${item.subType}-${Date.now()}`,
            type: 'action',
            data: {
                label: item.label,
                subType: item.subType,
                description: 'Click to configure'
            },
            position: { x: 500, y: 300 }
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const toggleCategory = (id) => {
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="h-screen flex bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-neutral-100 transition-colors duration-300">

            {/* Sidebar Palette */}
            <div className="w-72 bg-white dark:bg-[#0F0F0F] border-r border-gray-200 dark:border-[#262626] flex flex-col shadow-sm z-10 transition-colors duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
                    <button onClick={() => navigate('/automations')} className="text-gray-500 hover:text-gray-800 dark:hover:text-neutral-200 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <span className="font-semibold text-gray-700 dark:text-neutral-200">Components</span>
                    <div className="w-5" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {sidebarCategories.map((cat) => (
                        <div key={cat.id} className="border-b border-gray-100 dark:border-[#262626]">
                            <button
                                onClick={() => toggleCategory(cat.id)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
                            >
                                <span className="font-semibold text-sm text-gray-800 dark:text-neutral-200">{cat.title}</span>
                                {expandedCategories[cat.id] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                            </button>

                            {expandedCategories[cat.id] && (
                                <div className="pb-2">
                                    {cat.items.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => addNode(item)}
                                            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] cursor-pointer flex items-center gap-3 group transition-colors"
                                        >
                                            <item.icon size={18} className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                            <span className="text-sm text-gray-600 dark:text-neutral-400 group-hover:text-gray-900 dark:group-hover:text-neutral-200 transition-colors">{item.label}</span>
                                            <div className="flex-1" />
                                            <span className="opacity-0 group-hover:opacity-100 text-gray-400">
                                                <div className="grid grid-cols-2 gap-0.5">
                                                    <div className="w-1 h-1 rounded-full bg-current"></div>
                                                    <div className="w-1 h-1 rounded-full bg-current"></div>
                                                    <div className="w-1 h-1 rounded-full bg-current"></div>
                                                    <div className="w-1 h-1 rounded-full bg-current"></div>
                                                </div>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col relative">
                {/* Top Navbar */}
                <div className="h-16 bg-white dark:bg-[#0F0F0F] border-b border-gray-200 dark:border-[#262626] flex items-center justify-between px-6 shadow-sm z-10 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <input
                            value={flowName}
                            onChange={(e) => setFlowName(e.target.value)}
                            className="text-lg font-bold text-gray-800 dark:text-neutral-100 bg-transparent border-none focus:ring-0 placeholder-gray-400 dark:placeholder-neutral-600"
                            placeholder="Untitled Flow"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${isActive
                                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-[#1A1A1A] dark:border-[#404040] dark:text-neutral-400 dark:hover:bg-[#262626]'
                                }`}
                        >
                            {isActive ? <Pause size={16} /> : <Play size={16} />}
                            {isActive ? 'Active' : 'Draft'}
                        </button>

                        <button
                            onClick={saveFlow}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Flow'}
                        </button>
                    </div>
                </div>

                {/* Toolbar / Settings Overlay */}
                <div className="absolute top-20 right-6 z-20 w-80">
                    {selectedNode?.type === 'trigger' ? (
                        <div className="bg-white dark:bg-[#0F0F0F] rounded-xl shadow-xl border border-gray-100 dark:border-[#262626] overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="bg-gray-50 dark:bg-[#151515] px-4 py-3 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
                                <span className="font-semibold text-gray-700 dark:text-neutral-200 text-sm">Configure Trigger</span>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-neutral-400 mb-1">Trigger Event</label>
                                    <select
                                        value={triggerType}
                                        onChange={(e) => setTriggerType(e.target.value)}
                                        className="w-full text-sm border-gray-200 dark:border-[#404040] dark:bg-[#1A1A1A] dark:text-neutral-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {triggerOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {triggerType === 'KEYWORDS' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-neutral-400 mb-1">Keywords</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. hello, pricing"
                                            className="w-full text-sm border-gray-200 dark:border-[#404040] dark:bg-[#1A1A1A] dark:text-neutral-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            value={triggerData.keyword || ''}
                                            onChange={(e) => setTriggerData({ ...triggerData, keyword: e.target.value })}
                                        />
                                        <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">Comma separated</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-slate-50 dark:bg-[#050505] relative transition-colors duration-300" ref={reactFlowWrapper}>
                    {/* Dot Grid Background */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.1]"
                        style={{
                            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    />

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={(e, node) => setSelectedNode(node)}
                        onPaneClick={() => setSelectedNode(null)}
                        nodeTypes={nodeTypes}
                        fitView
                        attributionPosition="bottom-right"
                        className="dark:invert-0"
                    >
                        <Background color="#cbd5e1" gap={20} size={1} className="dark:opacity-10" />
                        <Controls className="!bg-white dark:!bg-[#0F0F0F] !border-gray-200 dark:!border-[#262626] !shadow-sm [&>button]:!text-gray-600 dark:[&>button]:!text-neutral-400 hover:[&>button]:!bg-gray-50 dark:hover:[&>button]:!bg-[#1A1A1A]" />
                        <MiniMap className="!bg-white dark:!bg-[#0F0F0F] !border-gray-200 dark:!border-[#262626] !shadow-sm" nodeColor="#e2e8f0" maskColor="rgba(248, 250, 252, 0.7)" />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}
