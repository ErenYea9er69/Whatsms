import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import api from '../services/api';

const Team = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Verified'); // Verified, Unverified
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'AGENT',
        avatar: ''
    });

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const data = await api.getTeamMembers();
            setMembers(data);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.addTeamMember(formData);
            fetchMembers();
            setIsModalOpen(false);
            setFormData({ name: '', email: '', role: 'AGENT', avatar: '' });
        } catch (error) {
            console.error('Failed to add team member:', error);
            alert('Failed to add team member');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this team member?')) return;
        try {
            await api.deleteTeamMember(id);
            fetchMembers();
        } catch (error) {
            console.error('Failed to delete member:', error);
        }
    };

    return (
        <div className="team-page p-6 bg-gray-50 dark:bg-black min-h-full transition-colors duration-300">
            {/* Top Tabs */}
            <div className="flex gap-8 border-b border-gray-200 dark:border-zinc-800 mb-8">
                <button
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'Verified' ? 'text-blue-600 dark:text-green-500' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                    onClick={() => setActiveTab('Verified')}
                >
                    Verified
                    {activeTab === 'Verified' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-green-500 rounded-t-full" />}
                </button>
                <button
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'Unverified' ? 'text-blue-600 dark:text-green-500' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                    onClick={() => setActiveTab('Unverified')}
                >
                    Unverified
                    {activeTab === 'Unverified' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-green-500 rounded-t-full" />}
                </button>
            </div>

            {/* Header Section */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Team</h1>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">Add, edit, and delete accounts in your team</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                    Invite User <Plus size={16} />
                </button>
            </div>

            {/* Controls Bar */}
            <div className="bg-white dark:bg-[#09090b] p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center border border-gray-100 dark:border-zinc-800">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search Team"
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-900/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-green-900 focus:bg-white dark:focus:bg-zinc-900 transition-all outline-none text-gray-700 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600"
                    />
                </div>
                <button className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 rounded-lg px-3 py-2 text-sm transition-all bg-white dark:bg-[#09090b]">
                    <SlidersHorizontal size={16} />
                    Columns
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#09090b] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-zinc-800">
                <table className="w-full">
                    <thead>
                        <tr className="bg-blue-50/50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-zinc-200">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-zinc-200">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-zinc-200">Role</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-zinc-200">Active/Inactive</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-zinc-200">Assignable</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-zinc-200">Last updated</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 dark:text-zinc-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-zinc-500 text-sm">Loading...</td></tr>
                        ) : members.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-zinc-500 text-sm">No team members found.</td></tr>
                        ) : (
                            members.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-sm font-medium text-gray-900 dark:text-zinc-200">{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-400">{member.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900 dark:text-zinc-300 capitalize">{member.role.toLowerCase()}</span>
                                    </td>
                                    {/* Mock Data for columns not in DB yet */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {/* Placeholder for Active/Inactive toggle logic */}
                                        <div className="w-8 h-4 bg-green-200 dark:bg-green-900/40 rounded-full relative cursor-pointer">
                                            <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {/* Placeholder for Assignable */}
                                        <input type="checkbox" className="rounded text-blue-600 dark:text-green-600 focus:ring-blue-500 dark:focus:ring-green-500 border-gray-300 dark:border-zinc-700 dark:bg-zinc-900" defaultChecked />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-500">
                                        {new Date(member.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} {new Date(member.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            className="text-gray-400 dark:text-zinc-600 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Member Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/20 dark:bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative p-6 border dark:border-zinc-800 w-96 shadow-2xl rounded-xl bg-white dark:bg-[#09090b] animate-fade-in up">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Invite Team Member</h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Send an invitation to join your team.</p>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-zinc-300 text-xs font-semibold mb-1.5 uppercase tracking-wide">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-green-500/20 focus:border-blue-500 dark:focus:border-green-500 transition-all placeholder-gray-300 dark:placeholder-zinc-600 dark:bg-zinc-900 dark:text-white"
                                    placeholder="Jane Doe"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-zinc-300 text-xs font-semibold mb-1.5 uppercase tracking-wide">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-green-500/20 focus:border-blue-500 dark:focus:border-green-500 transition-all placeholder-gray-300 dark:placeholder-zinc-600 dark:bg-zinc-900 dark:text-white"
                                    placeholder="jane@example.com"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 dark:text-zinc-300 text-xs font-semibold mb-1.5 uppercase tracking-wide">Role</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-green-500/20 focus:border-blue-500 dark:focus:border-green-500 transition-all bg-white dark:bg-zinc-900 dark:text-white"
                                >
                                    <option value="AGENT">Agent</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 dark:bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-green-700 shadow-sm shadow-blue-200 dark:shadow-none transition-colors"
                                >
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
