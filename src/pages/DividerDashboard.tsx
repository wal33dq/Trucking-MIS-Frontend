import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { findUsersByRole, uploadTasks } from '../api';

// Define a type for the history items, assuming its structure
interface UploadHistoryItem {
    _id: string;
    fileName: string;
    assignedAgentName: string;
    taskCount: number;
    createdAt: string;
}

export const DividerDashboard = () => {
    const [saleAgents, setSaleAgents] = useState<User[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('upload');
    const [history, setHistory] = useState<UploadHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            // NOTE: You will need to create the 'getUploadHistory' API endpoint on your backend.
            // For now, this will just be an empty array.
            // const response = await getUploadHistory();
            // setHistory(response.data);
            setHistory([]);
        } catch (err) {
            setError('Could not fetch upload history. This API might need to be created.');
            console.error(err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        const fetchSaleAgents = async () => {
            try {
                const response = await findUsersByRole(Role.SaleAgent);
                setSaleAgents(response.data);
                if (response.data.length > 0) {
                    setSelectedAgent(response.data[0]._id);
                }
            } catch (err) {
                setError('Failed to fetch sale agents.');
                console.error(err);
            }
        };
        fetchSaleAgents();
        fetchHistory();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setSuccess('');
            setError('');
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedAgent) {
            setError('Please select a sale agent and a file.');
            return;
        }
        setError('');
        setSuccess('');
        setUploading(true);
        try {
            await uploadTasks(selectedAgent, file);
            setSuccess('Tasks uploaded successfully!');
            setFile(null);
            // Refresh history after upload
            fetchHistory();
        } catch (err) {
            setError('Failed to upload tasks.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const renderUploadForm = () => (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Assign Tasks via CSV</h2>
            <form onSubmit={handleUpload}>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
                <div className="mb-4">
                    <label className="block text-gray-700">Assign to Sale Agent</label>
                    <select
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    >
                        <option value="" disabled>Select an agent</option>
                        {saleAgents.map((agent) => (
                            <option key={agent._id} value={agent._id}>
                                {agent.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Upload CSV File</label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    disabled={uploading}
                >
                    {uploading ? 'Uploading...' : 'Upload and Assign'}
                </button>
            </form>
        </div>
    );

    const renderHistory = () => (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Upload History</h2>
            {loadingHistory ? <p>Loading history...</p> : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Date</th>
                                <th className="py-2 px-4 border-b">File Name</th>
                                <th className="py-2 px-4 border-b">Assigned To</th>
                                <th className="py-2 px-4 border-b">Tasks Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? history.map((item) => (
                                <tr key={item._id}>
                                    <td className="py-2 px-4 border-b">{new Date(item.createdAt).toLocaleString()}</td>
                                    <td className="py-2 px-4 border-b">{item.fileName}</td>
                                    <td className="py-2 px-4 border-b">{item.assignedAgentName}</td>
                                    <td className="py-2 px-4 border-b">{item.taskCount}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-4">No upload history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Project Divider Dashboard</h1>
            
            <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'upload'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Upload Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'history'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Upload History
                    </button>
                </nav>
            </div>
            
            {activeTab === 'upload' ? renderUploadForm() : renderHistory()}
        </div>
    );
};
