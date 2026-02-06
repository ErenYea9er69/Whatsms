import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import InternalNotes from '../components/InternalNotes';

const Conversation = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (id) {
            fetchConversation();
            fetchTeamMembers();
        }
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversation = async () => {
        try {
            setLoading(true);
            const data = await api.getConversation(id);
            setConversation(data);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to fetch conversation:', error);
            // Handle error (e.g., redirect to inbox)
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const data = await api.getTeamMembers();
            setTeamMembers(data);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const msg = await api.sendMessage(id, {
                content: newMessage,
                // senderId: currentUserId // Should be handled by backend or auth context
            });
            setMessages([...messages, msg]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleAssign = async (e) => {
        const assignedToId = e.target.value;
        try {
            const updated = await api.assignConversation(id, assignedToId);
            setConversation(prev => ({ ...prev, assignedTo: updated.assignedTo, assignedToId: updated.assignedToId }));
        } catch (error) {
            console.error('Failed to assign agent:', error);
        }
    };

    const handleStatusChange = async (status) => {
        try {
            const updated = await api.updateConversationStatus(id, status);
            setConversation(prev => ({ ...prev, status: updated.status }));
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    if (loading) return <div className="p-6 text-center">{t('conversation_loading')}</div>;
    if (!conversation) return <div className="p-6 text-center">{t('conversation_not_found')}</div>;

    return (
        <div className="conversation-page h-[calc(100vh-64px)] flex flex-col md:flex-row bg-white dark:bg-gray-900">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/inbox')} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mr-2 md:hidden">
                            &larr; {t('btn_back')}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold text-lg">
                            {conversation.contact?.name?.[0] || 'C'}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800 dark:text-white">{conversation.contact?.name}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{conversation.contact?.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {conversation.status === 'OPEN' ? (
                            <button
                                onClick={() => handleStatusChange('CLOSED')}
                                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded"
                            >
                                {t('btn_mark_closed')}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStatusChange('OPEN')}
                                className="text-xs bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded"
                            >
                                {t('btn_reopen')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-4">
                    {messages.map((msg) => {
                        const isOutbound = msg.direction === 'OUTBOUND';
                        return (
                            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-lg p-3 ${isOutbound
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                                    } shadow-sm`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <div className={`text-[10px] mt-1 ${isOutbound ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isOutbound && msg.sender && ` • ${msg.sender.name}`}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={t('placeholder_type_message')}
                            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:placeholder-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            {t('btn_send')}
                        </button>
                    </form>
                </div>
            </div>

            {/* Sidebar (Details + Notes) */}
            <div className="w-full md:w-80 bg-white dark:bg-gray-800 p-4 overflow-y-auto border-l border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('label_assignment')}</h3>
                    <select
                        value={conversation.assignedToId || ''}
                        onChange={handleAssign}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">{t('label_unassigned')}</option>
                        {teamMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('label_contact_info')}</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-100 dark:border-gray-600">
                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-1"><span className="font-semibold">{t('label_name')}</span> {conversation.contact?.name}</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-1"><span className="font-semibold">{t('label_phone')}</span> {conversation.contact?.phone}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {conversation.contact?.tags?.map((tag, i) => (
                                <span key={i} className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <InternalNotes contactId={conversation.contactId} />
            </div>
        </div>
    );
};

export default Conversation;
