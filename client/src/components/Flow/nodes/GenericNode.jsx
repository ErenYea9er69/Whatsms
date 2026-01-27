import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import {
    FileText, Image, MousePointerClick, List, LayoutTemplate,
    Users, UserMinus, Tag, Hash, Layout, Clock, Trash2, MoreVertical,
    AlertCircle, Bold, Italic, Strikethrough, Code, Plus, Upload, X
} from 'lucide-react';

const icons = {
    text: FileText,
    media: Image,
    buttons: MousePointerClick,
    list: List,
    template: LayoutTemplate,
    addGroup: Users,
    removeGroup: UserMinus,
    addTag: Tag,
    removeTag: Hash,
    addPipeline: Layout,
    removePipeline: Trash2,
    delay: Clock
};

// --- Helper Components ---

const NodeHeader = ({ label, icon: Icon, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                {Icon && <Icon size={18} className="text-gray-500 dark:text-gray-400" />}
                <span>{label}</span>
            </div>
            <div className="relative" ref={menuRef}>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <MoreVertical size={16} className="text-gray-400 dark:text-gray-500" />
                </button>
                {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#1A1A1A] rounded-lg shadow-xl border border-gray-100 dark:border-[#333] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button
                            onClick={onDelete}
                            className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ErrorBanner = ({ message = "Please fill all the required fields" }) => (
    <div className="bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium mb-3 shadow-sm">
        <AlertCircle size={14} className="flex-shrink-0" />
        <span>{message}</span>
    </div>
);

const IconButton = ({ icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className="p-1.5 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
    >
        <Icon size={14} />
    </button>
);

const Toolbar = () => (
    <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1">
            <IconButton icon={Bold} />
            <IconButton icon={Italic} />
            <IconButton icon={Strikethrough} />
            <IconButton icon={Code} />
        </div>
        <div className="flex-1" />
        <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
            Add Variable
        </button>
    </div>
);

// --- Form Components ---

const TextForm = ({ data, onChange }) => {
    const isValid = data.content && data.content.length > 0;

    return (
        <div>
            {!isValid && <ErrorBanner />}

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                <span className="text-red-500">*</span> Respond with a simple text message.
            </p>

            <div className="relative">
                <textarea
                    className="nodrag w-full border border-gray-200 dark:border-[#333] bg-white dark:bg-[#0A0A0A] dark:text-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px] resize-none"
                    placeholder="Enter text"
                    value={data.content || ''}
                    onChange={(e) => onChange('content', e.target.value)}
                />
                <div className="absolute bottom-2 right-2">
                    <svg className="w-2 h-2 text-gray-300 pointer-events-none" viewBox="0 0 10 10"><path d="M10 10L10 0L0 10L10 10Z" fill="currentColor" /></svg>
                </div>
            </div>

            <div className="flex justify-between items-center mt-1 text-xs text-gray-400 dark:text-gray-500 mb-3">
                <span>Characters: {(data.content || '').length}/1098</span>
            </div>

            <Toolbar />
        </div>
    );
};

const MediaForm = ({ data, onChange }) => {
    const mediaTypes = ['Image', 'Video', 'Audio', 'Document'];
    const isValid = data.mediaType && data.file;

    return (
        <div>
            {!isValid && <ErrorBanner />}

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Respond with an image, video, audio or document.
            </p>

            <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    <span className="text-red-500">*</span> Media Type
                </label>
                <select
                    className="nodrag w-full border border-gray-200 dark:border-[#333] bg-white dark:bg-[#0A0A0A] dark:text-gray-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    value={data.mediaType || 'Image'}
                    onChange={(e) => onChange('mediaType', e.target.value)}
                >
                    {mediaTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Caption (Optional)
                </label>
                <textarea
                    className="nodrag w-full border border-gray-200 dark:border-[#333] bg-white dark:bg-[#0A0A0A] dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none min-h-[60px]"
                    placeholder="Enter text"
                    value={data.caption || ''}
                    onChange={(e) => onChange('caption', e.target.value)}
                />
                <div className="flex justify-between items-center mt-1 text-xs text-gray-400 dark:text-gray-500 mb-2">
                    <span>Characters: {(data.caption || '').length}/1098</span>
                </div>
                <Toolbar />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="text-red-500">*</span> Upload media
                </label>

                {data.file ? (
                    <div className="relative border border-gray-200 dark:border-[#333] rounded-lg p-3 bg-gray-50 dark:bg-[#151515] flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Image size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate dark:text-gray-200">{data.file.name}</div>
                            <div className="text-xs text-gray-500">{(data.file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button
                            onClick={() => onChange('file', null)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-[#333] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#151515] transition-colors relative">
                        <input
                            type="file"
                            className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                            onChange={(e) => {
                                if (e.target.files?.[0]) onChange('file', e.target.files[0]);
                            }}
                        />
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upload image file</div>
                        <div className="text-xs text-gray-400 mt-1">PNG or JPG files only</div>
                    </div>
                )}
            </div>

        </div>
    );
};

const DefaultForm = ({ data, onChange }) => (
    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
        Configuration for this node type is coming soon.
        <br />
        <span className="text-xs font-mono mt-1 block opacity-70">Type: {data.subType}</span>
    </div>
);


// --- Main Node Component ---

export default function GenericNode({ id, data }) {
    const { setNodes, deleteElements } = useReactFlow();

    const updateData = useCallback((field, value) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return {
                    ...node,
                    data: { ...node.data, [field]: value }
                };
            }
            return node;
        }));
    }, [id, setNodes]);

    const handleDelete = useCallback((e) => {
        e?.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    }, [id, deleteElements]);

    const Icon = icons[data.subType] || FileText;

    return (
        <div className="min-w-[320px] max-w-[360px] bg-white dark:bg-[#0F0F0F] rounded-xl shadow-lg border border-gray-200 dark:border-[#262626] font-sans transition-colors duration-200">
            <Handle type="target" position={Position.Left} className="!bg-gray-400 dark:!bg-neutral-600 !w-3 !h-3 !-left-1.5" />

            {/* Container */}
            <div className="p-5">
                <NodeHeader label={data.label} icon={Icon} onDelete={handleDelete} />

                {data.subType === 'text' && <TextForm data={data} onChange={updateData} />}
                {data.subType === 'media' && <MediaForm data={data} onChange={updateData} />}
                {(!['text', 'media'].includes(data.subType)) && <DefaultForm data={data} onChange={updateData} />}
            </div>

            <Handle type="source" position={Position.Right} className="!bg-gray-400 dark:!bg-neutral-600 !w-3 !h-3 !-right-1.5" />
        </div>
    );
}
