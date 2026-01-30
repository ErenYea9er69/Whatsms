import React from 'react';
import { Paperclip, CheckCheck } from 'lucide-react';

const WhatsAppPreview = ({ header, body, footer, files, buttons }) => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Helper to highlight variables like {{1}}
    const renderBody = (text) => {
        if (!text) return <span className="text-gray-400 italic">Type something...</span>;

        const parts = text.split(/(\{\{\d+\}\})/g);
        return parts.map((part, index) => {
            if (part.match(/\{\{\d+\}\}/)) {
                return (
                    <span key={index} className="bg-blue-100 text-blue-600 px-1 rounded mx-0.5 font-medium">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#E5DDD5] dark:bg-[#0b141a] rounded-xl overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none dark:invert"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M200 400c110.457 0 200-89.543 200-200S310.457 0 200 0 0 89.543 0 200s89.543 200 200 200zm-82.5-224.5l-42.5 42.5-42.5-42.5 42.5-42.5 42.5 42.5zm165 0l-42.5 42.5-42.5-42.5 42.5-42.5 42.5 42.5zm-165 165l-42.5 42.5-42.5-42.5 42.5-42.5 42.5 42.5zm165 0l-42.5 42.5-42.5-42.5 42.5-42.5 42.5 42.5zM200 282.5l-42.5 42.5-42.5-42.5 42.5-42.5 42.5 42.5zm0-165l-42.5 42.5-42.5-42.5 42.5-42.5 42.5 42.5z'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '400px'
                }}
            />

            <div className="w-full max-w-[320px] relative z-10 flex flex-col gap-2">

                {/* Message Bubble */}
                <div className="bg-white dark:bg-[#202c33] rounded-lg shadow-sm p-1 relative rounded-tr-none self-end message-bubble-tail">
                    <div className="p-2 pb-6 min-w-[120px]">
                        {/* Media Preview */}
                        {files && files.length > 0 && (
                            <div className="mb-2 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center h-40 border border-gray-100 dark:border-gray-700">
                                <div className="text-center p-4">
                                    <Paperclip className="mx-auto mb-2 text-gray-400" size={24} />
                                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{files[0].filename}</p>
                                    <p className="text-[10px] text-gray-400 uppercase mt-0.5">{files[0].mimetype?.split('/')[1] || 'FILE'}</p>
                                </div>
                            </div>
                        )}

                        {/* Header */}
                        {header && (
                            <div className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1 leading-snug">
                                {header}
                            </div>
                        )}

                        {/* Body */}
                        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {renderBody(body)}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 pt-1 border-t border-gray-100 dark:border-gray-700/50">
                                {footer}
                            </div>
                        )}
                    </div>

                    {/* Meta (Time + Ticks) */}
                    <div className="absolute right-2 bottom-1 flex items-center gap-1">
                        <span className="text-[10px] text-gray-400">{currentTime}</span>
                        <CheckCheck size={14} className="text-[#53bdeb]" />
                    </div>
                </div>

                {/* Buttons */}
                {buttons && buttons.length > 0 && buttons.map((btn, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#202c33] rounded-lg shadow-sm p-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span className="text-[#00a884] font-medium text-sm block truncate">
                            {btn.type === 'URL' && '🔗 '}
                            {btn.type === 'PHONE_NUMBER' && '📞 '}
                            {btn.text || 'Button Text'}
                        </span>
                    </div>
                ))}

            </div>
        </div>
    );
};

export default WhatsAppPreview;
