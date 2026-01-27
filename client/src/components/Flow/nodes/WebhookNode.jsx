import { Handle, Position } from '@xyflow/react';
import { Webhook } from 'lucide-react';

export default function WebhookNode({ data }) {
    return (
        <div className="px-4 py-3 rounded-xl min-w-[200px] shadow-lg"
            style={{
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                borderWidth: '2px',
                borderColor: 'rgba(20, 184, 166, 0.5)'
            }}>
            <Handle type="target" position={Position.Top} className="!bg-teal-500 !w-3 !h-3" />

            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(20, 184, 166, 0.2)' }}>
                    <Webhook size={16} className="text-teal-400" />
                </div>
                <span className="text-xs font-bold text-teal-400 uppercase">Webhook</span>
            </div>

            <div className="text-sm text-white font-medium">
                {data.label || 'Send to Webhook'}
            </div>

            <input
                type="text"
                placeholder="https://..."
                defaultValue={data.url || ''}
                className="mt-2 w-full bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700"
            />

            <select
                defaultValue={data.method || 'POST'}
                className="mt-2 w-full bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700"
            >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
            </select>

            <Handle type="source" position={Position.Bottom} className="!bg-teal-500 !w-3 !h-3" />
        </div>
    );
}
