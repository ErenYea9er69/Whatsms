import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Check, Sparkles, Loader2, Wand2, X, ChevronDown, ChevronUp } from 'lucide-react';
import aiService from '../services/ai';

/**
 * Messenger-style AI Chat Panel for Templates & Campaigns
 * @param {string} currentContent - The current message body text to provide context
 * @param {function} onApplyText - Callback to apply AI-suggested text to the form
 * @param {string} contentType - 'template' or 'campaign' for context-aware prompts
 */
const AiChatPanel = ({ currentContent = '', onApplyText, contentType = 'template' }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Quick action suggestions
    const quickActions = [
        { label: '📊 Analyze my text', prompt: 'Analyze my current text and give feedback' },
        { label: '✂️ Make it shorter', prompt: 'Make my current text shorter and more concise' },
        { label: '😊 Add emojis', prompt: 'Add relevant emojis to my current text' },
        { label: '🎯 Improve CTA', prompt: 'Improve the call-to-action in my text' },
    ];

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        if (!isCollapsed) {
            inputRef.current?.focus();
        }
    }, [isCollapsed]);

    const handleSend = async (customPrompt = null) => {
        const text = customPrompt || input.trim();
        if (!text || loading) return;

        // Add user message
        const userMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Build messages for AI
            const chatHistory = [...messages, userMessage];

            // Call AI service with context
            const response = await aiService.chatAssistant(chatHistory, currentContent, contentType);

            // Add AI response
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (text, index) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleApply = (text) => {
        if (onApplyText) {
            onApplyText(text);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
                <Wand2 size={16} />
                <span>AI Assistant</span>
                <ChevronUp size={16} />
            </button>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">AI Assistant</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ask me anything about your {contentType}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ChevronDown size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-3">
                            <Wand2 size={24} className="text-violet-500" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Hi! I can help you write, edit, or analyze your {contentType}.
                        </p>
                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(action.prompt)}
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user'
                                            ? 'bg-primary text-white rounded-br-md'
                                            : msg.isError
                                                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-bl-md'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                                    {/* Action buttons for AI messages */}
                                    {msg.role === 'assistant' && !msg.isError && (
                                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <button
                                                onClick={() => handleCopy(msg.content, idx)}
                                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                            >
                                                {copiedIndex === idx ? (
                                                    <>
                                                        <Check size={12} className="text-green-500" />
                                                        <span className="text-green-500">Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={12} />
                                                        <span>Copy</span>
                                                    </>
                                                )}
                                            </button>
                                            {onApplyText && (
                                                <button
                                                    onClick={() => handleApply(msg.content)}
                                                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                                                >
                                                    <Wand2 size={12} />
                                                    <span>Apply</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin text-violet-500" />
                                        <span className="text-sm text-gray-500">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Quick Actions Row (when there are messages) */}
            {messages.length > 0 && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                    {quickActions.slice(0, 3).map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(action.prompt)}
                            disabled={loading}
                            className="flex-shrink-0 px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        rows={1}
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-primary resize-none text-sm min-h-[42px] max-h-[120px]"
                        style={{ height: 'auto' }}
                        disabled={loading}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="p-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiChatPanel;
