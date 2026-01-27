import { Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

export default function MessageNode({ data }) {
    return (
        <div className="px-4 py-3 rounded-xl min-w-[200px] shadow-lg"
            style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: '2px',
                borderColor: 'rgba(59, 130, 246, 0.5)'
            }}>
            <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />

            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                    <MessageSquare size={16} className="text-blue-400" />
                </div>
                <span className="text-xs font-bold text-blue-400 uppercase">Send Message</span>
            </div>

            <div className="text-sm text-white font-medium truncate max-w-[180px]">
                {data.label || 'New message'}
            </div>

            {data.message && (
                <div className="mt-2 text-xs text-gray-400 line-clamp-2 bg-gray-800/50 p-2 rounded">
                    {data.message.substring(0, 60)}...
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
        </div>
    );
}
