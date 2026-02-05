import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Search, FileText, Image as ImageIcon, Video, Music, MoreVertical, X, Loader2 } from 'lucide-react';
import api from '../services/api';

const MediaLibrary = ({ onSelect, isModal }) => {
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    // const [error, setError] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const fileInputRef = useRef(null);

    const fetchMedia = async () => {
        try {
            setLoading(true);
            const data = await api.getMedia();
            setMediaItems(data.media || []);
        } catch (err) {
            // setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await api.uploadMedia(file);
            setShowUploadModal(false);
            fetchMedia();

            // If in selection mode, auto-select uploaded file
            if (onSelect) {
                const previewUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${result.media.path}`;
                onSelect({
                    ...result.media,
                    previewUrl
                });
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Prevent selection when deleting
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            await api.deleteMedia(id);
            setMediaItems(mediaItems.filter(m => m.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSelect = (media) => {
        if (!onSelect) return;
        const previewUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${media.path}`;
        onSelect({
            ...media,
            previewUrl
        });
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getIcon = (mimetype) => {
        if (mimetype.startsWith('image/')) return <ImageIcon size={24} className="text-purple-500" />;
        if (mimetype.startsWith('video/')) return <Video size={24} className="text-pink-500" />;
        if (mimetype.startsWith('audio/')) return <Music size={24} className="text-emerald-500" />;
        return <FileText size={24} className="text-gray-500" />;
    };

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            {!isModal && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage images, videos, and documents for your campaigns</p>
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-xl text-sm font-medium shadow-glow"
                    >
                        <Upload size={18} strokeWidth={2} />
                        <span>Upload File</span>
                    </button>
                </div>
            )}

            {isModal && (
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold">Select Media</h2>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Upload size={16} strokeWidth={2} />
                        <span>Upload New</span>
                    </button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl skeleton" />
                    ))}
                </div>
            ) : mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <ImageIcon size={32} className="text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No media files yet</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="mt-2 text-primary text-sm hover:underline"
                    >
                        Upload your first file
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-20">
                    {mediaItems.map((media) => (
                        <div
                            key={media.id}
                            onClick={onSelect ? () => handleSelect(media) : undefined}
                            className={`group relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 overflow-hidden ${onSelect ? 'cursor-pointer ring-2 ring-transparent hover:ring-primary' : 'card-hover'}`}
                        >
                            <div className="aspect-square bg-gray-50 dark:bg-black/20 flex items-center justify-center relative overflow-hidden">
                                {media.mimetype.startsWith('image/') ? (
                                    <img
                                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${media.path}`}
                                        alt={media.filename}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    getIcon(media.mimetype)
                                )}

                                {!onSelect && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                        <button
                                            onClick={(e) => handleDelete(media.id, e)}
                                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}

                                {onSelect && (
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-lg">Select</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-medium truncate text-gray-900 dark:text-white" title={media.filename}>
                                    {media.filename}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {formatSize(media.size)} • {media.mimetype.split('/')[1].toUpperCase()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Upload Media</h2>
                            <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleUpload}
                                accept="image/*,video/*,application/pdf"
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 size={32} className="text-primary animate-spin mb-3" />
                                    <p className="text-sm font-medium">Uploading...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                                        <Upload size={24} />
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white">Click to upload</p>
                                    <p className="text-xs text-gray-500 mt-1">Images, Videos, PDF (Max 16MB)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaLibrary;
