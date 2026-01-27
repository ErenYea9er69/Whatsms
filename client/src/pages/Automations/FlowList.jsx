import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Play, Pause, Trash2, Edit, GitBranch } from 'lucide-react';

export default function FlowList() {
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFlows();
    }, []);

    const fetchFlows = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/flows', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setFlows(data);
        } catch (err) {
            console.error('Failed to fetch flows', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteFlow = async (id) => {
        if (!confirm('Are you sure? This will stop any active executions.')) return;
        try {
            await fetch(`http://localhost:3000/api/flows/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchFlows();
        } catch (err) {
            console.error('Failed to delete flow', err);
        }
    };

    const toggleStatus = async (flow) => {
        try {
            await fetch(`http://localhost:3000/api/flows/${flow.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ isActive: !flow.isActive })
            });
            fetchFlows();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading automations...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Automations</h1>
                    <p className="text-gray-500 dark:text-gray-400">Build automated message flows and chatbots</p>
                </div>
                <Link
                    to="/automations/new"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Create Flow
                </Link>
            </div>

            {flows.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                    <GitBranch size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No automations yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first automated workflow to engage customers 24/7.</p>
                    <Link
                        to="/automations/new"
                        className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                    >
                        Get Started &rarr;
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flows.map(flow => (
                        <div key={flow.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg ${flow.isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    <GitBranch size={24} />
                                </div>
                                <div className="relative group">
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1">
                                        <span className="sr-only">Menu</span>
                                        •••
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 hidden group-hover:block z-10 border border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => deleteFlow(flow.id)}
                                            className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{flow.name}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{flow.description || 'No description provided.'}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{flow._count?.executions || 0} runs</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleStatus(flow)}
                                        className={`p-2 rounded-lg transition-colors ${flow.isActive
                                                ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                                            }`}
                                        title={flow.isActive ? 'Pause' : 'Activate'}
                                    >
                                        {flow.isActive ? <Pause size={18} /> : <Play size={18} />}
                                    </button>
                                    <Link
                                        to={`/automations/${flow.id}`}
                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
