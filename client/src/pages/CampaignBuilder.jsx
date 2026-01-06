import React, { useState } from 'react';
import { Send, Calendar, Paperclip, Users, Clock, Save, X } from 'lucide-react';

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
        // Array.from(e.target.files).forEach...
        console.log('Files selected', e.target.files);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">New Campaign</h1>
                <div className="flex gap-2 text-sm">
                    <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>1. Compose</span>
                    <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>2. Recipients</span>
                    <span className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>3. Review</span>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8">

                {/* Step 1: Compose */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Campaign Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="e.g. Monthly Newsletter"
                                value={campaign.name}
                                onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 outline-none h-40 resize-none"
                                placeholder="Type your message here..."
                                value={campaign.message}
                                onChange={(e) => setCampaign({ ...campaign, message: e.target.value })}
                            ></textarea>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-gray-500">Variables: {'{{name}}'}, {'{{phone}}'}</p>
                                <button className="text-sm text-primary font-medium hover:underline">Use Template</button>
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                                <Paperclip size={16} />
                                Attach Files
                                <input type="file" multiple className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 2: Recipients */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Select Contact Lists</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['VIP Customers', 'New Leads', 'Newsletter Subscribers', 'Inactive Users'].map((list) => (
                                <label key={list} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20" />
                                    <span className="font-medium">{list}</span>
                                    <span className="ml-auto text-xs text-gray-500 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">124 contacts</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Schedule */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-background-dark p-6 rounded-xl space-y-4">
                            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                                <span className="text-gray-500">Campaign</span>
                                <span className="font-medium">{campaign.name || 'Untitled Campaign'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                                <span className="text-gray-500">Recipients</span>
                                <span className="font-medium">2 lists selected (Approx. 250 contacts)</span>
                            </div>
                            <div className="py-2">
                                <p className="text-sm text-gray-500 mb-2">Message Preview:</p>
                                <p className="p-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm italic">
                                    {campaign.message || '(No message content)'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <label className="font-medium">Scheduling</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-primary bg-blue-50 dark:bg-blue-900/10 text-primary">
                                    <input type="radio" name="schedule" defaultChecked className="text-primary" />
                                    <Send size={16} />
                                    Send Now
                                </label>
                                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <input type="radio" name="schedule" className="text-primary" />
                                    <Calendar size={16} />
                                    Schedule for Later
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    {step > 1 ? (
                        <button onClick={() => setStep(step - 1)} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < 3 ? (
                        <button onClick={() => setStep(step + 1)} className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-md shadow-blue-500/20">
                            Next Step
                        </button>
                    ) : (
                        <button className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md shadow-green-500/20">
                            <Send size={18} />
                            Launch Campaign
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CampaignBuilder;
