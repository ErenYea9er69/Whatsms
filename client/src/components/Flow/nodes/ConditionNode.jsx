import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export default function ConditionNode({ data }) {
    return (
        <div className="px-4 py-3 rounded-xl min-w-[200px] shadow-lg"
            style={{
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderWidth: '2px',
                borderColor: 'rgba(168, 85, 247, 0.5)'
            }}>
            <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />

            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}>
                    <GitBranch size={16} className="text-purple-400" />
                </div>
                <span className="text-xs font-bold text-purple-400 uppercase">Condition</span>
            </div>

            <div className="text-sm text-white font-medium">
                {data.label || 'If/Else Branch'}
            </div>

            <div className="mt-2 text-xs text-gray-400">
                {data.condition || 'Check user response'}
            </div>

            <div className="flex justify-between mt-3 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-400">Yes</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-400">No</span>
                </div>
            </div>

            {/* Two output handles for branching */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="yes"
                className="!bg-green-500 !w-3 !h-3"
                style={{ left: '30%' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="no"
                className="!bg-red-500 !w-3 !h-3"
                style={{ left: '70%' }}
            />
        </div>
    );
}
