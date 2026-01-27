import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

export default function TriggerNode({ data }) {
    const triggerTypes = {
        NEW_CONTACT: { label: 'New Contact', color: 'emerald' },
        KEYWORD: { label: 'Keyword Match', color: 'blue' },
        WEBHOOK: { label: 'Webhook Event', color: 'purple' },
        NO_REPLY: { label: 'No Reply After', color: 'orange' }
    };

    const trigger = triggerTypes[data.triggerType] || triggerTypes.NEW_CONTACT;

    return (
        <div className={`px-4 py-3 rounded-xl bg-${trigger.color}-500/10 border-2 border-${trigger.color}-500/50 min-w-[180px]`}
            style={{
                backgroundColor: `rgba(16, 185, 129, 0.1)`,
                borderColor: `rgba(16, 185, 129, 0.5)`
            }}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Play size={16} className="text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Trigger</span>
            </div>
            <div className="text-sm font-medium text-white">{data.label || trigger.label}</div>
            {data.keyword && (
                <div className="mt-2 text-xs text-gray-400">
                    Keyword: <span className="text-emerald-300">"{data.keyword}"</span>
                </div>
            )}
            <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3" />
        </div>
    );
}
