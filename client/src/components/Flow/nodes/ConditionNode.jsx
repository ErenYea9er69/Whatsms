import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export default function ConditionNode({ data }) {
    return (
        <div className="min-w-[240px] bg-white rounded-lg shadow-sm border border-gray-200">
            <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3" />

            <div className="p-3 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                    <GitBranch size={16} className="text-purple-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Condition</span>
            </div>

            <div className="p-3">
                <div className="text-xs text-gray-500 mb-2">Check if...</div>
                <div className="text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                    {data.condition || 'User replies "Yes"'}
                </div>

                <div className="flex justify-between mt-4">
                    <div className="text-xs font-semibold text-green-600 uppercase">True</div>
                    <div className="text-xs font-semibold text-red-600 uppercase">False</div>
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
