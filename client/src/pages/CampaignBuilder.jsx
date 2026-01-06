import React, { useState } from 'react';
import { Send, Calendar, Paperclip, Users, Clock, ChevronRight, Check, FileText, Image, X } from 'lucide-react';

const CampaignBuilder = () => {
    const [step, setStep] = useState(1);
    const [campaign, setCampaign] = useState({
        name: '',
        message: '',
        files: [],
        lists: [],
        scheduledAt: '',
    });

    const handleFileChange = (e) => {
        console.log('Files selected', e.target.files);
    };

    const steps = [
        { number: 1, label: 'Compose', icon: FileText },
        { number: 2, label: 'Recipients', icon: Users },
        { number: 3, label: 'Review', icon: Check },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Campaign</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Create and send a new message campaign</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80">
                <div className="flex items-center justify-between">
                    {steps.map((s, index) => (
                        <React.Fragment key={s.number}>
                            <button
                                onClick={() => setStep(s.number)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 ${step >= s.number
                                        ? 'text-primary'
                                        : 'text-gray-400'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${step > s.number
                                        ? 'bg-primary text-white'
                                        : step === s.number
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-primary border-2 border-primary'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                    }`}>
                                    {step > s.number ? (
                                        <Check size={18} strokeWidth={2.5} />
                                    ) : (
                                        <s.icon size={18} className={step === s.number ? '' : 'icon-gray'} strokeWidth={1.75} />
                                    )}
                                </div>
                                <span className={`font-medium hidden sm:block ${step >= s.number ? '' : 'text-gray-400'}`}>
                                    {s.label}
                                </span>
                            </button>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-200 ${step > s.number ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 p-6 md:p-8">

                {/* Step 1: Compose */}
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Campaign Name
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none transition-all text-base"
                                placeholder="e.g. Monthly Newsletter"
                                value={campaign.name}
                                onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Message
                            </label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none transition-all h-40 resize-none text-base"
                                placeholder="Type your message here..."
                                value={campaign.message}
                                onChange={(e) => setCampaign({ ...campaign, message: e.target.value })}
                            />
                            <div className="flex justify-between items-center mt-3">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{'{{name}}'}</span>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{'{{phone}}'}</span>
                                </div>
                                <button className="text-sm text-primary font-medium hover:underline">
                                    Use Template
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Attachments
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer w-full p-4 bg-gray-50 dark:bg-background-dark border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary dark:hover:border-primary transition-colors group">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                    <Paperclip size={18} className="icon-gray group-hover:text-primary transition-colors" strokeWidth={1.75} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload files</p>
                                    <p className="text-xs text-gray-400">Images, PDFs, documents up to 10MB</p>
                                </div>
                                <input type="file" multiple className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 2: Recipients */}
                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Select Contact Lists</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Choose which lists to send this campaign to</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: 'VIP Customers', count: 245 },
                                { name: 'New Leads', count: 892 },
                                { name: 'Newsletter Subscribers', count: 1456 },
                                { name: 'Inactive Users', count: 328 },
                            ].map((list, index) => (
                                <label
                                    key={list.name}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group card-hover animate-slide-up"
                                    style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
                                >
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary/20"
                                    />
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <Users size={18} className="icon-gray" strokeWidth={1.75} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-medium block">{list.name}</span>
                                        <span className="text-xs text-gray-500">{list.count.toLocaleString()} contacts</span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Tip:</strong> You can also upload a CSV file or manually add phone numbers in the Contacts section.
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Schedule */}
                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Review Campaign</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Verify details before sending</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-background-dark p-6 rounded-xl space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-500 flex items-center gap-2">
                                    <FileText size={16} className="icon-gray" strokeWidth={1.75} />
                                    Campaign Name
                                </span>
                                <span className="font-medium">{campaign.name || 'Untitled Campaign'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-500 flex items-center gap-2">
                                    <Users size={16} className="icon-gray" strokeWidth={1.75} />
                                    Recipients
                                </span>
                                <span className="font-medium">2 lists selected (~2,700 contacts)</span>
                            </div>
                            <div className="pt-2">
                                <p className="text-sm text-gray-500 mb-3">Message Preview:</p>
                                <div className="p-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl text-sm">
                                    {campaign.message || <span className="text-gray-400 italic">No message content</span>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Scheduling</label>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <label className="flex-1 flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all border-primary bg-blue-50 dark:bg-blue-900/10 text-primary">
                                    <input type="radio" name="schedule" defaultChecked className="text-primary w-4 h-4" />
                                    <Send size={18} className="icon-gray" strokeWidth={1.75} />
                                    <div>
                                        <span className="font-medium block">Send Now</span>
                                        <span className="text-xs text-gray-500">Deliver immediately</span>
                                    </div>
                                </label>
                                <label className="flex-1 flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                                    <input type="radio" name="schedule" className="text-primary w-4 h-4" />
                                    <Calendar size={18} className="icon-gray" strokeWidth={1.75} />
                                    <div>
                                        <span className="font-medium block text-gray-700 dark:text-gray-200">Schedule</span>
                                        <span className="text-xs text-gray-500">Pick a date & time</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors font-medium"
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="flex items-center gap-2 px-6 py-2.5 btn-primary text-white font-medium rounded-xl shadow-glow"
                        >
                            <span>Next Step</span>
                            <ChevronRight size={18} strokeWidth={2} />
                        </button>
                    ) : (
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30">
                            <Send size={18} strokeWidth={2} />
                            <span>Launch Campaign</span>
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CampaignBuilder;
