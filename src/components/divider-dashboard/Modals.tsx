import React, { useState, useEffect } from 'react';
import { User, Role, Task } from '../../types';
import { findUsersByRole, assignTaskToDispatcher, reassignTask, followUpTask } from '../../api';
import { BriefcaseIcon, UserIcon, DollarSignIcon, FileTextIcon, MailIcon, PhoneIcon, ClockIcon, CalendarIcon, MapPinIcon } from './Icons';

const BACKEND_URL = 'https://icollectbackend.huburllc.com';

export const AssignToDispatcherModal = ({ task, onClose, onAssigned }: { task: Task, onClose: () => void, onAssigned: () => void }) => {
    const [dispatchers, setDispatchers] = useState<User[]>([]);
    const [selectedDispatcher, setSelectedDispatcher] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDispatchers = async () => {
            try {
                const response = await findUsersByRole(Role.Dispatcher);
                setDispatchers(response.data);
                if (response.data.length > 0) {
                    setSelectedDispatcher(response.data[0]._id);
                }
            } catch (err) {
                setError('Failed to fetch dispatchers.');
            }
        };
        fetchDispatchers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDispatcher) {
            setError('Please select a dispatcher.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await assignTaskToDispatcher(task._id, selectedDispatcher);
            onAssigned();
            onClose();
        } catch (err) {
            setError('Failed to assign task. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 hover:scale-100">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Assign Task</h2>
                <p className="mb-6 text-gray-500">Assigning task for: <strong className="text-indigo-600">{task.companyName}</strong></p>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2 font-semibold">Select Dispatcher</label>
                        <select
                            value={selectedDispatcher}
                            onChange={(e) => setSelectedDispatcher(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            required
                        >
                            <option value="" disabled>Select...</option>
                            {dispatchers.map((d: User) => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-md hover:shadow-lg transition disabled:bg-gray-400" disabled={submitting}>
                            {submitting ? 'Assigning...' : 'Confirm Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ReassignTaskModal = ({ task, onClose, onAssigned }: { task: Task, onClose: () => void, onAssigned: () => void }) => {
    const [saleAgents, setSaleAgents] = useState<User[]>([]);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await findUsersByRole(Role.SaleAgent);
                setSaleAgents(response.data);
                if (response.data.length > 0) {
                    setSelectedAgent(response.data[0]._id);
                }
            } catch (err) { setError('Failed to fetch sale agents.'); }
        };
        fetchAgents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAgent) { setError('Please select a sale agent.'); return; }
        setSubmitting(true);
        setError('');
        try {
            await reassignTask(task._id, selectedAgent);
            onAssigned();
            onClose();
        } catch (err) {
            setError('Failed to re-assign task.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-2">Re-assign Task</h2>
                <p className="mb-6 text-gray-500">Re-assigning: <strong className="text-indigo-600">{task.companyName}</strong></p>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2 font-semibold">Select Sale Agent</label>
                        <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" required>
                            <option value="" disabled>Select...</option>
                            {saleAgents.map((d: User) => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-100">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 text-white" disabled={submitting}>
                            {submitting ? 'Re-assigning...' : 'Confirm Re-assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const FollowUpModal = ({ task, onClose, onSuccess }: { task: Task, onClose: () => void, onSuccess: () => void }) => {
    const [comment, setComment] = useState('');
    const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !followUpDate) { setError('Both a date and a comment are required.'); return; }
        setSubmitting(true);
        setError('');
        try {
            await followUpTask(task._id, comment, followUpDate);
            onSuccess();
        } catch (err) {
            setError('Failed to update task. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-2">Mark for Follow-up</h2>
                <p className="mb-6 text-gray-500">{task.companyName}</p>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                    <div className="mb-4">
                         <label className="block text-gray-700 mb-2 font-semibold">Follow-up Date</label>
                         <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2 font-semibold">Follow-up Comment</label>
                        <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="e.g., Need to call back to confirm details." rows={4} required />
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-100">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-purple-600 text-white" disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save Comment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ViewTaskModal = ({ task, onClose }: { task: Task, onClose: () => void }) => {
    if (!task) return null;

    const DetailItem = ({ icon, label, value, highlight = false, fullWidth = false }: { icon: React.ReactNode, label: string, value?: string | number, highlight?: boolean, fullWidth?: boolean }) => (
        <div className={`flex items-start py-3 ${fullWidth ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''}`}>
            <div className="flex-shrink-0">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className={`text-gray-900 font-semibold break-words ${highlight ? 'text-indigo-600' : ''}`}>{value || 'N/A'}</p>
            </div>
        </div>
    );
    
    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{task.companyName}</h2>
                        <p className="text-gray-500">{task.mcNumber}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl">&times;</button>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">Core Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 border-b border-gray-200 pb-4">
                    <DetailItem icon={<UserIcon />} label="Sale Agent" value={(task.saleAgent as User)?.name} />
                    <DetailItem icon={<UserIcon />} label="Driver Name" value={task.driverName} />
                    <DetailItem icon={<DollarSignIcon />} label="Offer Rate" value={`${task.offerRate}%`} highlight/>
                    <DetailItem icon={<BriefcaseIcon />} label="Truck Type" value={task.truckType} />
                    <DetailItem icon={<BriefcaseIcon />} label="Weight" value={`${task.weight} lbs`} />
                    <DetailItem icon={<BriefcaseIcon />} label="Status" value={task.status} highlight/>
                    <DetailItem icon={<ClockIcon />} label="Call Time" value={task.callTime} />
                    <DetailItem icon={<CalendarIcon />} label="Working Date" value={formatDateTime(task.workingDate)} />
                  
                </div>

                <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-6">Contact & Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 border-b border-gray-200 pb-4">
                    <DetailItem icon={<MailIcon />} label="Email" value={task.email} />
                    <DetailItem icon={<PhoneIcon />} label="Phone" value={task.phone} />
                    <DetailItem icon={<MapPinIcon />} label="Address" value={task.address} fullWidth />
                </div>

                <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-6">Documents & Comments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 border-b border-gray-200 pb-4">
                    {task.statusUpdateComment && (
                         <DetailItem icon={<FileTextIcon />} label={`Comment for '${task.status}' status`} value={task.statusUpdateComment} fullWidth />
                    )}
                    <DetailItem icon={<FileTextIcon />} label="Original Comments" value={task.comments} fullWidth />
                    <div className="lg-col-span-3">
                         <h3 className="text-md font-semibold text-gray-700 mb-2 mt-4 flex items-center"><FileTextIcon /> Documents</h3>
                        {task.documentUrls && task.documentUrls.length > 0 ? (
                            <ul className="list-disc list-inside pl-8">
                                {task.documentUrls.map((url, index) => (
                                    <li key={index}>
                                        <a href={`${BACKEND_URL}/${url}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                            View Document {index + 1}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-gray-500 pl-8">No documents uploaded.</p>}
                    </div>
                </div>

                <div className="flex justify-end mt-8 pt-6">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition">Close</button>
                </div>
            </div>
        </div>
    );
};

export const DeleteConfirmationModal = ({ task, onClose, onConfirm, isDeleting, tasksToDelete }: { task?: Task | null, tasksToDelete?: string[], onClose: () => void, onConfirm: () => void, isDeleting: boolean }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Confirm Deletion</h2>
            <p className="mb-6 text-gray-500">
                {task ? (
                    <>Are you sure you want to delete the task for <strong className="text-red-600">{task.companyName}</strong>?</>
                ) : (
                    <>Are you sure you want to delete <strong className="text-red-600">{tasksToDelete?.length}</strong> selected tasks?</>
                )}
                This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4 mt-8">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold" disabled={isDeleting}>Cancel</button>
                <button type="button" onClick={onConfirm} className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold shadow-md" disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
            </div>
        </div>
    </div>
);
