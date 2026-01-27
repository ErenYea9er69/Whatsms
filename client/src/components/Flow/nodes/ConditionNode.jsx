import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export default function ConditionNode({ data }) {
    return (
        <div className="min-w-[240px] bg-white dark:bg-[#0F0F0F] rounded-lg shadow-sm border border-gray-200 dark:border-[#262626] transition-colors duration-200">
            <Handle type="target" position={Position.Top} className="!bg-gray-400 dark:!bg-neutral-600 !w-3 !h-3" />

            <div className="p-3 border-b border-gray-50 dark:border-[#262626] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center border border-purple-100 dark:border-purple-900/30">
                    <GitBranch size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-neutral-100">Condition</span>
            </div>

            <div className="p-3">
                <div className="text-xs text-gray-500 dark:text-neutral-500 mb-2">Check if...</div>
                <div className="text-sm font-medium text-gray-700 dark:text-neutral-200 bg-gray-50 dark:bg-[#1A1A1A] p-2 rounded border border-gray-100 dark:border-[#262626]">
                    {data.condition || 'User replies "Yes"'}
                </div>

                <div className="flex justify-between mt-4">
                    <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">True</div>
                    <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">False</div>
                </div>
            </div>

            {/* Two output handles for branching relative to the container */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                className="!bg-green-500 !w-3 !h-3 !left-[25%]"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                className="!bg-red-500 !w-3 !h-3 !left-[75%]"
            />
        </div>
    );
}
