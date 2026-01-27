import { Handle, Position } from '@xyflow/react';
import { FormInput } from 'lucide-react';

export default function CollectInputNode({ data }) {
    return (
        <div className="px-4 py-3 rounded-xl min-w-[200px] shadow-lg"
            style={{
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderWidth: '2px',
                borderColor: 'rgba(249, 115, 22, 0.5)'
            }}>
            <Handle type="target" position={Position.Top} className="!bg-orange-500 !w-3 !h-3" />

            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)' }}>
                    <FormInput size={16} className="text-orange-400" />
                </div>
                <span className="text-xs font-bold text-orange-400 uppercase">Collect Input</span>
            </div>

            <div className="text-sm text-white font-medium">
                {data.label || 'Get User Response'}
            </div>

            <div className="mt-2 space-y-2">
                <input
                    type="text"
                    placeholder="Variable name"
                    defaultValue={data.variable || ''}
                    className="w-full bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700"
                />
                <select
                    defaultValue={data.inputType || 'text'}
                    className="w-full bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700"
                >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="choice">Button Choice</option>
                </select>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !w-3 !h-3" />
        </div>
    );
}
