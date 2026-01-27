import { Handle, Position } from '@xyflow/react';
import {
    FileText, Image, MousePointerClick, List, LayoutTemplate,
    Users, UserMinus, Tag, Hash, Layout, Clock, Trash2
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

export default function GenericNode({ data, type }) {
    const Icon = icons[data.subType] || FileText;

    return (
        <div className="min-w-[240px] bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group">
            <Handle type="target" position={Position.Left} className="!bg-gray-400 dark:!bg-gray-500 !w-3 !h-3 !-left-1.5" />

            <div className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600 transition-colors">
                    <Icon size={20} className="text-gray-600 dark:text-gray-300" />
                </div>

                <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{data.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                        {data.description || 'Configure...'}
                    </div>
                </div>

                <button className="text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                </button>
            </div>

            <Handle type="source" position={Position.Right} className="!bg-gray-400 dark:!bg-gray-500 !w-3 !h-3 !-right-1.5" />
        </div>
    );
}
