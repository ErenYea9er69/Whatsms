import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

export default function DelayNode({ data }) {
    return (
        <div className="px-4 py-3 rounded-xl min-w-[180px] shadow-lg"
            style={{
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                borderWidth: '2px',
                borderColor: 'rgba(234, 179, 8, 0.5)'
            }}>
            <Handle type="target" position={Position.Top} className="!bg-yellow-500 !w-3 !h-3" />

            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)' }}>
                    <Clock size={16} className="text-yellow-400" />
                </div>
                <span className="text-xs font-bold text-yellow-400 uppercase">Wait</span>
            </div>

            <div className="text-sm text-white font-medium">
                {data.label || 'Wait 1 hour'}
            </div>

            <div className="mt-2 flex gap-2">
                <input
                    type="number"
                    defaultValue={data.duration || 1}
                    className="w-16 bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-700"
                    min="1"
                />
                <select
                    defaultValue={data.unit || 'hours'}
                    className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-700"
                >
                    <option value="minutes">min</option>
                    <option value="hours">hrs</option>
                    <option value="days">days</option>
                </select>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-yellow-500 !w-3 !h-3" />
        </div>
    );
}
