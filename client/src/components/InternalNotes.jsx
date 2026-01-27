import React, { useState, useEffect } from 'react';
import api from '../services/api';

const InternalNotes = ({ contactId }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (contactId) {
            fetchNotes();
        }
    }, [contactId]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const data = await api.getNotes(contactId);
            setNotes(data);
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
            // Assuming current user is author, but we might not have current user ID easily available without auth context.
            // API notes router handles authorId optional or we can pass it if we have it.
            // For now, let's send content and contactId.
            await api.addNote({
                contactId: parseInt(contactId),
                content: newNote
                // authorId: currentUser.id // Implementation dependency
            });
            setNewNote('');
            fetchNotes();
        } catch (error) {
            console.error('Failed to add note:', error);
        }
    };

    return (
        <div className="internal-notes bg-gray-50 dark:bg-slate-800/30 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Internal Notes</h3>

            <div className="notes-list space-y-3 mb-4 max-h-60 overflow-y-auto">
                {loading ? (
                    <p className="text-xs text-gray-500 dark:text-slate-400">Loading notes...</p>
                ) : notes.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-slate-400 italic">No notes yet.</p>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="note-item bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700 shadow-sm">
                            <p className="text-xs text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{note.content}</p>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-gray-500 dark:text-slate-400">
                                    {note.author ? note.author.name : 'Unknown User'}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                    {new Date(note.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleAddNote} className="note-form">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note..."
                    className="w-full text-xs p-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:placeholder-slate-500"
                    rows="2"
                />
                <button
                    type="submit"
                    disabled={!newNote.trim()}
                    className="w-full bg-gray-600 dark:bg-slate-700 hover:bg-gray-700 dark:hover:bg-slate-600 text-white text-xs py-1 px-2 rounded disabled:opacity-50 transition-colors"
                >
                    Add Note
                </button>
            </form>
        </div>
    );
};

export default InternalNotes;
