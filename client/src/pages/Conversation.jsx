import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import InternalNotes from '../components/InternalNotes';

const Conversation = () => {
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

    if (loading) return <div className="p-6 text-center">Loading conversation...</div>;
    if (!conversation) return <div className="p-6 text-center">Conversation not found</div>;

    return (
        <div className="conversation-page h-[calc(100vh-64px)] flex flex-col md:flex-row bg-white">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col border-r border-gray-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/inbox')} className="text-gray-500 hover:text-gray-700 mr-2 md:hidden">
                            &larr; Back
                        </button>
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-lg">
                            {conversation.contact?.name?.[0] || 'C'}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">{conversation.contact?.name}</h2>
                            <p className="text-xs text-gray-500">{conversation.contact?.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {conversation.status === 'OPEN' ? (
                            <button
                                onClick={() => handleStatusChange('CLOSED')}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded"
                            >
                                Mark Closed
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStatusChange('OPEN')}
                                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1 rounded"
                            >
                                Reopen
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                    {messages.map((msg) => {
                        const isOutbound = msg.direction === 'OUTBOUND';
                        return (
                            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-lg p-3 ${isOutbound
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                    } shadow-sm`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <div className={`text-[10px] mt-1 ${isOutbound ? 'text-blue-100' : 'text-gray-400'}`}>
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
                <div className="p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>

            {/* Sidebar (Details + Notes) */}
            <div className="w-full md:w-80 bg-white p-4 overflow-y-auto border-l border-gray-200">
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Assignment</h3>
                    <select
                        value={conversation.assignedToId || ''}
                        onChange={handleAssign}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Unassigned</option>
                        {teamMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Info</h3>
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                        <p className="text-sm text-gray-800 mb-1"><span className="font-semibold">Name:</span> {conversation.contact?.name}</p>
                        <p className="text-sm text-gray-800 mb-1"><span className="font-semibold">Phone:</span> {conversation.contact?.phone}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {conversation.contact?.tags?.map((tag, i) => (
                                <span key={i} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{tag}</span>
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
