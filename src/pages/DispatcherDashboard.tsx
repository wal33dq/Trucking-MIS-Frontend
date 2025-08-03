import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { getSubmittedTasks, invoiceTask } from '../api';

const InvoiceModal = ({ task, onClose, onInvoice }: { task: Task, onClose: () => void, onInvoice: () => void }) => {
    const [formData, setFormData] = useState({
        poNumber: '',
        loadDetail: '',
        pickupDate: '',
        deliveryDate: '',
        rate: '',
        brokerDetail: '',
        loadStatus: '',
        invoiceAmount: '',
        invoiceDate: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await invoiceTask(task._id, formData);
            onInvoice();
            onClose();
        } catch(err) {
            setError('Failed to generate invoice.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Generate Invoice for {task.companyName}</h2>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="grid grid-cols-2 gap-4">
                        <input name="poNumber" placeholder="PO Number" onChange={handleChange} className="p-2 border rounded" required/>
                        <input name="rate" placeholder="Rate" type="number" onChange={handleChange} className="p-2 border rounded" required/>
                        <input name="invoiceAmount" placeholder="Invoice Amount" type="number" onChange={handleChange} className="p-2 border rounded" required/>
                        <input name="loadStatus" placeholder="Load Status" onChange={handleChange} className="p-2 border rounded" required/>
                        <div className="col-span-2"><input name="loadDetail" placeholder="Load Detail" onChange={handleChange} className="w-full p-2 border rounded" required/></div>
                        <div className="col-span-2"><input name="brokerDetail" placeholder="Broker Detail" onChange={handleChange} className="w-full p-2 border rounded" required/></div>
                        <div><label>Pickup Date</label><input name="pickupDate" type="date" onChange={handleChange} className="w-full p-2 border rounded" required/></div>
                        <div><label>Delivery Date</label><input name="deliveryDate" type="date" onChange={handleChange} className="w-full p-2 border rounded" required/></div>
                        <div><label>Invoice Date</label><input name="invoiceDate" type="date" onChange={handleChange} className="w-full p-2 border rounded" required/></div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="bg-gray-300 p-2 rounded">Cancel</button>
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded" disabled={submitting}>
                            {submitting ? 'Generating...' : 'Generate Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const DispatcherDashboard = () => {
    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [activeTab, setActiveTab] = useState('pending');

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const pendingResponse = await getSubmittedTasks();
            setPendingTasks(pendingResponse.data);
            // NOTE: The 'getInvoicedTasks' API endpoint needs to be created on the backend.
            // For now, history will be empty.
            // const historyResponse = await getInvoicedTasks();
            // setHistoryTasks(historyResponse.data);
            setHistoryTasks([]); // Set to empty array until API is ready
        } catch (err) {
            setError('Failed to fetch tasks. Note: getInvoicedTasks API might need to be created.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const renderPendingTable = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">MC Number</th>
                        <th className="py-2 px-4 border-b">Company</th>
                        <th className="py-2 px-4 border-b">Phone</th>
                        <th className="py-2 px-4 border-b">Driver</th>
                        <th className="py-2 px-4 border-b">Offer Rate</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingTasks.map((task) => (
                        <tr key={task._id}>
                            <td className="py-2 px-4 border-b">{task.mcNumber}</td>
                            <td className="py-2 px-4 border-b">{task.companyName}</td>
                            <td className="py-2 px-4 border-b">{task.phone}</td>
                            <td className="py-2 px-4 border-b">{task.driverName}</td>
                            <td className="py-2 px-4 border-b">${task.offerRate}</td>
                            <td className="py-2 px-4 border-b">
                                <button onClick={() => setSelectedTask(task)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                                    Generate Invoice
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderHistoryTable = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">MC Number</th>
                        <th className="py-2 px-4 border-b">Company</th>
                        <th className="py-2 px-4 border-b">Invoice Amount</th>
                        <th className="py-2 px-4 border-b">Invoice Date</th>
                        <th className="py-2 px-4 border-b">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {historyTasks.map((task) => (
                        <tr key={task._id}>
                            <td className="py-2 px-4 border-b">{task.mcNumber}</td>
                            <td className="py-2 px-4 border-b">{task.companyName}</td>
                            <td className="py-2 px-4 border-b">${task.invoiceAmount}</td>
                            <td className="py-2 px-4 border-b">{task.invoiceDate ? new Date(task.invoiceDate).toLocaleDateString() : 'N/A'}</td>
                            <td className="py-2 px-4 border-b">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {task.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    if (loading) return <p className="text-center mt-8">Loading...</p>;
    if (error) return <p className="text-red-500 text-center mt-8">{error}</p>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Dispatcher Dashboard</h1>

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

            <div className="bg-white p-6 rounded-lg shadow-md mt-4">
                <h2 className="text-2xl font-bold mb-4">
                    {activeTab === 'pending' ? 'Pending Tasks for Invoicing' : 'Invoiced Tasks History'}
                </h2>
                {activeTab === 'pending' ? renderPendingTable() : renderHistoryTable()}
            </div>
            {selectedTask && <InvoiceModal task={selectedTask} onClose={() => setSelectedTask(null)} onInvoice={fetchTasks} />}
        </div>
    );
};
