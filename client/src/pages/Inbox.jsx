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
        <div className="inbox-page p-6 h-full flex flex-col">
            <header className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Team Inbox</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus('OPEN')}
                        className={`px-3 py-1 rounded text-sm transition-colors ${filterStatus === 'OPEN' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                        Open
                    </button>
                    <button
                        onClick={() => setFilterStatus('CLOSED')}
                        className={`px-3 py-1 rounded text-sm transition-colors ${filterStatus === 'CLOSED' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                        Closed
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex-1">
                <div className="grid grid-cols-1 divide-y divide-gray-100 dark:divide-gray-700">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading conversations...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">No conversations found.</div>
                    ) : (
                        conversations.map((conv) => (
                            <Link
                                key={conv.id}
                                to={`/inbox/${conv.id}`}
                                className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors p-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                                            {conv.contact?.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{conv.contact?.name || 'Unknown Contact'}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                                                {conv.lastMessage || 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {conv.updatedAt ? new Date(conv.updatedAt).toLocaleString() : ''}
                                        </p>
                                        {conv.assignedTo ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 mt-1">
                                                {conv.assignedTo.name}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 mt-1">
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
