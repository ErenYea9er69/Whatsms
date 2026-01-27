import { Handle, Position } from '@xyflow/react';
import { Play, ChevronDown } from 'lucide-react';

export default function TriggerNode({ data }) {
    const triggerOptions = {
        NEW_CONVERSATION: 'New conversation',
        KEYWORDS: 'Text contains specific keywords',
        HAS_TAGS: 'Contact has specific tags',
        PIPELINE_UPDATE: 'Contact has been affected to a pipeline',
        SHORT_RESPONSE: 'Advanced Short response'
    };

    const label = triggerOptions[data.triggerType] || 'Select option';

    return (
        <div className="min-w-[280px] bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 font-sans transition-colors duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-indigo-600 rounded p-1">
                        <Play size={14} className="text-white" fill="white" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-semibold text-sm">Trigger</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                    Define the input parameters to trigger the workflow, to ensure that accurate information is captured in the conversation flow.
                </p>
            </div>

            {/* Body */}
            <div className="p-4">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Starting Step</div>
                <div className="relative">
                    <div className="w-full bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm px-3 py-2.5 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <span className="truncate">{label}</span>
                        <ChevronDown size={16} className="text-gray-400" />
                    </div>
                </div>

                {/* Keyword Input Display */}
                {data.triggerType === 'KEYWORDS' && data.keyword && (
                    <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800">
                        Contains: "{data.keyword}"
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!bg-emerald-400 !w-4 !h-4 !border-4 !border-white dark:!border-gray-800 !-right-2"
            />
        </div>
    );
}
