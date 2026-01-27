import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Inbox = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('OPEN');
    const [teamMembers, setTeamMembers] = useState([]);

    useEffect(() => {
        fetchConversations();
        fetchTeamMembers();
    }, [filterStatus]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const data = await api.getConversations({ status: filterStatus });
            setConversations(data);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
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

    return (
        <div className="inbox-page p-6">
            <header className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Team Inbox</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus('OPEN')}
                        className={`px-3 py-1 rounded text-sm ${filterStatus === 'OPEN' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Open
                    </button>
                    <button
                        onClick={() => setFilterStatus('CLOSED')}
                        className={`px-3 py-1 rounded text-sm ${filterStatus === 'CLOSED' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Closed
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading conversations...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No conversations found.</div>
                    ) : (
                        conversations.map((conv) => (
                            <Link
                                key={conv.id}
                                to={`/inbox/${conv.id}`}
                                className="block hover:bg-gray-50 transition-colors p-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                            {conv.contact?.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{conv.contact?.name || 'Unknown Contact'}</h3>
                                            <p className="text-sm text-gray-500 truncate max-w-md">
                                                {conv.lastMessage || 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">
                                            {conv.updatedAt ? new Date(conv.updatedAt).toLocaleString() : ''}
                                        </p>
                                        {conv.assignedTo ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                                                {conv.assignedTo.name}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                                Unassigned
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Inbox;
