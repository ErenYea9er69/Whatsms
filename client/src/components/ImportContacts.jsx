import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const ImportContacts = ({ onClose, onSuccess }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "text/csv" || droppedFile.name.endsWith('.csv')) {
                setFile(droppedFile);
                setError(null);
            } else {
                setError("Please upload a valid CSV file.");
            }
        }
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const data = await api.importContacts(file);
            setResult(data);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.message || "Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setError(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Import Contacts</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {!result ? (
                        <>
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${dragActive
                                        ? "border-primary bg-blue-50 dark:bg-blue-900/10"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={uploading}
                                />

                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3">
                                            <FileText size={24} />
                                        </div>
                                        <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mb-3">
                                            <Upload size={24} />
                                        </div>
                                        <p className="font-medium text-gray-900 dark:text-white">Click or drag CSV here</p>
                                        <p className="text-sm text-gray-500 mt-1">Columns: name, phone, interests</p>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium text-white transition-all ${!file || uploading
                                            ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                                            : "btn-primary shadow-glow hover:-translate-y-0.5"
                                        }`}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        "Import Contacts"
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                                <Check size={32} strokeWidth={3} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Import Complete</h3>
                            <div className="flex justify-center gap-8 my-6">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{result.imported}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Imported</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{result.skipped}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Skipped</p>
                                </div>
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div className="text-left bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-6 max-h-32 overflow-y-auto text-xs text-gray-600 dark:text-gray-400">
                                    <p className="font-medium mb-1">Errors:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {result.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={reset}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Import More
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 btn-primary text-white rounded-xl text-sm font-medium shadow-glow"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportContacts;
