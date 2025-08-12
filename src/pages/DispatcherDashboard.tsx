import React, { useState, useEffect } from 'react';
import { Task } from '../types'; // Assuming types are defined in ../types
import { getSubmittedTasks, invoiceTask } from '../api'; // Assuming API functions are in ../api

// Define the base URL of your backend for creating document links
const BACKEND_URL = 'https://api.theonellc.com';

// --- InvoiceModal Component ---
const InvoiceModal = ({ task, onClose, onInvoice }: { task: Task, onClose: () => void, onInvoice: () => void }) => {
    const [formData, setFormData] = useState({
        poNumber: '',
        loadDetail: '',
        pickupDate: '',
        deliveryDate: '',
        rate: task.offerRate?.toString() || '',
        brokerDetail: '',
        loadStatus: '',
        invoiceAmount: '',
        invoiceDate: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await invoiceTask(task._id, formData);
            onInvoice(); // Refresh the tasks list
            onClose(); // Close the modal
        } catch (err) {
            setError('Failed to generate invoice. Please try again.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Generate Invoice for {task.companyName}</h2>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg mb-4">{error}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="poNumber" placeholder="PO Number" value={formData.poNumber} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                        <input name="rate" placeholder="Rate" type="number" value={formData.rate} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                        <input name="invoiceAmount" placeholder="Invoice Amount" type="number" value={formData.invoiceAmount} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                        <input name="loadStatus" placeholder="Load Status" value={formData.loadStatus} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                        <div className="md:col-span-2"><input name="loadDetail" placeholder="Load Detail" value={formData.loadDetail} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required /></div>
                        <div className="md:col-span-2"><input name="brokerDetail" placeholder="Broker Detail" value={formData.brokerDetail} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required /></div>
                        <div><label className="text-sm font-medium text-gray-600">Pickup Date</label><input name="pickupDate" type="date" value={formData.pickupDate} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg mt-1" required /></div>
                        <div><label className="text-sm font-medium text-gray-600">Delivery Date</label><input name="deliveryDate" type="date" value={formData.deliveryDate} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg mt-1" required /></div>
                        <div className="md:col-span-2"><label className="text-sm font-medium text-gray-600">Invoice Date</label><input name="invoiceDate" type="date" value={formData.invoiceDate} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg mt-1" required /></div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold transition-colors disabled:bg-indigo-300" disabled={submitting}>
                            {submitting ? 'Generating...' : 'Generate Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- DispatcherDashboard Component ---
export const DispatcherDashboard = () => {
    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [activeTab, setActiveTab] = useState('pending');

    // Fetches tasks from the API
    const fetchTasks = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch all tasks and filter them by status
            const response = await getSubmittedTasks();
            const allTasks: Task[] = response.data;

            const pending = allTasks.filter(task => task.status === 'submitted' || task.status === 'assigned');
            const history = allTasks.filter(task => task.status === 'invoiced');
            
            setPendingTasks(pending);
            setHistoryTasks(history);

        } catch (err) {
            setError('Failed to fetch tasks.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // --- Renders the styled table for pending tasks ---
    const renderPendingTable = () => (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {['MC Number', 'Company', 'Address', 'Phone', 'Email', 'Sale Agent', 'Driver Name', 'Truck Type', 'Offer Rate', 'Comments', 'Documents', 'Actions'].map(head => (
                            <th key={head} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {head}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {pendingTasks.map((task) => (
                        <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.mcNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.companyName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.address}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {task.saleAgent && typeof task.saleAgent === 'object' ? (task.saleAgent as any).name : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.driverName || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.truckType || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">${task.offerRate || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{task.comments || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {task.documentUrls && task.documentUrls.length > 0 ? (
                                    <ul className="space-y-1">
                                        {task.documentUrls.map((url, index) => {
                                            const filename = url.split(/[\\/]/).pop();
                                            const fullUrl = `${BACKEND_URL}/${url.replace(/\\/g, '/')}`;
                                            return (
                                                <li key={index}>
                                                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                                        {filename || `Document ${index + 1}`}
                                                    </a>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    'No documents'
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => setSelectedTask(task)} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all shadow-sm">
                                    Generate Invoice
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // --- Renders the styled table for invoiced history ---
    const renderHistoryTable = () => (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                         {['MC Number', 'Company', 'Invoice Amount', 'Invoice Date', 'Status'].map(head => (
                            <th key={head} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {head}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {historyTasks.map((task) => (
                        <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.mcNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.companyName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">${task.invoiceAmount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.invoiceDate ? new Date(task.invoiceDate).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    task.status === 'invoiced' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {task.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    if (loading) return <div className="flex justify-center items-center h-screen"><p className="text-lg font-semibold">Loading Dashboard...</p></div>;
    if (error) return <div className="flex justify-center items-center h-screen"><p className="text-red-500 text-center p-4 bg-red-100 rounded-lg">{error}</p></div>;

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Dispatcher Dashboard</h1>

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'pending'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Pending Invoices
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'history'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Invoice History
                        </button>
                    </nav>
                </div>

                <div className="mt-8">
                    {activeTab === 'pending' ? renderPendingTable() : renderHistoryTable()}
                </div>
                
                {selectedTask && <InvoiceModal task={selectedTask} onClose={() => setSelectedTask(null)} onInvoice={fetchTasks} />}
            </div>
        </div>
    );
};
