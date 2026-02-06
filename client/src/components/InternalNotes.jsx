import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const InternalNotes = ({ contactId }) => {
    const { t } = useTranslation();
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
        <div className="internal-notes bg-gray-50 dark:bg-zinc-900/30 p-4 rounded-lg border border-gray-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">{t('notes_title')}</h3>

            <div className="notes-list space-y-3 mb-4 max-h-60 overflow-y-auto">
                {loading ? (
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('notes_loading')}</p>
                ) : notes.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-zinc-400 italic">{t('notes_empty')}</p>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="note-item bg-white dark:bg-zinc-900 p-2 rounded border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <p className="text-xs text-gray-800 dark:text-zinc-200 whitespace-pre-wrap">{note.content}</p>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                                    {note.author ? note.author.name : t('notes_unknown_user')}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-zinc-500">
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
                    placeholder={t('notes_placeholder')}
                    className="w-full text-xs p-2 border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-green-500 dark:placeholder-zinc-500"
                    rows="2"
                />
                <button
                    type="submit"
                    disabled={!newNote.trim()}
                    className="w-full bg-gray-600 dark:bg-zinc-700 hover:bg-gray-700 dark:hover:bg-zinc-600 text-white text-xs py-1 px-2 rounded disabled:opacity-50 transition-colors"
                >
                    {t('btn_add_note')}
                </button>
            </form>
        </div>
    );
};

export default InternalNotes;
