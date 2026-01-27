import { Handle, Position } from '@xyflow/react';
import { UserPlus } from 'lucide-react';

export default function AssignNode({ data }) {
    return (
        <div className="px-4 py-3 rounded-xl min-w-[180px] shadow-lg"
            style={{
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                borderWidth: '2px',
                borderColor: 'rgba(236, 72, 153, 0.5)'
            }}>
            <Handle type="target" position={Position.Top} className="!bg-pink-500 !w-3 !h-3" />

            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)' }}>
                    <UserPlus size={16} className="text-pink-400" />
                </div>
                <span className="text-xs font-bold text-pink-400 uppercase">Assign</span>
            </div>

            <div className="text-sm text-white font-medium">
                {data.label || 'Assign to Agent'}
            </div>

            <select
                defaultValue={data.agent || ''}
                className="mt-2 w-full bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-700"
            >
                <option value="">Select agent...</option>
                <option value="agent1">Agent 1</option>
                <option value="agent2">Agent 2</option>
                <option value="round-robin">Round Robin</option>
            </select>

            <Handle type="source" position={Position.Bottom} className="!bg-pink-500 !w-3 !h-3" />
        </div>
    );
}
