import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Task, User } from '../types';
import { getMyAssignments } from '../api';

const BACKEND_BASE_URL = 'http://localhost:3000';

interface Document {
    name: string;
    url: string;
}

interface SubmittedTask extends Task {
    dispatcher?: User;
    documents?: Document[];
    documentUrls?: string[];
}

const SubmittedTaskDetailModal = ({ task, onClose }: { task: SubmittedTask, onClose: () => void }) => {
    if (!task) return null;
    const dispatcher = task.dispatcher;

    // Fixed document click handler
    const handleDocumentClick = (url: string) => {
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Error opening document:', error);
            alert('Could not open document. Please try again or contact support.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl relative max-h-full overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                <h2 className="text-2xl font-bold mb-6">Submitted Details for {task.companyName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div><p className="font-bold">Driver Name:</p> <p>{task.driverName || 'N/A'}</p></div>
                    <div><p className="font-bold">Offer Rate:</p> <p>${task.offerRate || 'N/A'}</p></div>
                    <div><p className="font-bold">Working Date:</p> <p>{task.workingDate ? new Date(task.workingDate).toLocaleDateString() : 'N/A'}</p></div>
                    <div><p className="font-bold">Call Time:</p> <p>{task.callTime || 'N/A'}</p></div>
                    <div><p className="font-bold">Weight:</p> <p>{task.weight ? `${task.weight} lbs` : 'N/A'}</p></div>
                    <div><p className="font-bold">Assigned Dispatcher:</p> <p>{dispatcher?.name || 'N/A'}</p></div>
                    <div className="md:col-span-2">
                        <p className="font-bold">Comments:</p>
                        <p className="bg-gray-50 p-3 rounded mt-1 border">{task.comments || 'No comments provided.'}</p>
                    </div>
                    <div className="md:col-span-2">
                        <p className="font-bold">Submitted Documents:</p>
                        <ul className="list-disc list-inside bg-gray-50 p-3 rounded mt-1 border">
                            {task.documents && task.documents.length > 0 ? task.documents.map((doc: Document, index: number) => (
                                <li key={index}>
                                    <button
                                        onClick={() => handleDocumentClick(doc.url)}
                                        className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer text-left"
                                    >
                                        {doc.name}
                                    </button>
                                </li>
                            )) : <li>No documents were submitted.</li>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SaleAgentDashboard = () => {
  const [tasks, setTasks] = useState<SubmittedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [selectedTask, setSelectedTask] = useState<SubmittedTask | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await getMyAssignments();
        
        const processedData = response.data.map((task: SubmittedTask) => {
            let documents: Document[] = [];
            if (task.documentUrls && Array.isArray(task.documentUrls)) {
                documents = task.documentUrls.map((urlPath: string) => {
                    // Extract just the filename from the path
                    const filename = urlPath.split(/[\\/]/).pop() || 'Document';
                    
                    // CORRECTED: Build URL using the API endpoint
                    const fullUrl = `${BACKEND_BASE_URL}/api/documents/${encodeURIComponent(filename)}`;
                    
                    return { name: filename, url: fullUrl };
                });
            }
            
            return {
                ...task,
                documents: documents,
            };
        });

        setTasks(processedData);
      } catch (err) {
        setError('Failed to fetch assignments.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [])

  const currentTasks = tasks.filter(task => task.status === 'assigned');
  const historyTasks = tasks.filter(task => task.status !== 'assigned');

  const renderCurrentTasksTable = (tasksToRender: SubmittedTask[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">MC Number</th>
            <th className="py-2 px-4 border-b">Company Name</th>
            <th className="py-2 px-4 border-b">Phone</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasksToRender.length > 0 ? tasksToRender.map((task) => (
            <tr key={task._id}>
              <td className="py-2 px-4 border-b">{task.mcNumber}</td>
              <td className="py-2 px-4 border-b">{task.companyName}</td>
              <td className="py-2 px-4 border-b">{task.phone}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800`}>
                    {task.status}
                </span>
              </td>
              <td className="py-2 px-4 border-b">
                <Link
                  to={`/task/${task._id}`}
                  className="text-indigo-600 hover:text-indigo-900 font-medium"
                >
                  Submit Info
                </Link>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="text-center py-4">No current tasks found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderHistoryTable = (tasksToRender: SubmittedTask[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Company Name</th>
            <th className="py-2 px-4 border-b">Driver Name</th>
            <th className="py-2 px-4 border-b">Dispatcher Name</th>
            <th className="py-2 px-4 border-b">Offer Rate</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasksToRender.length > 0 ? tasksToRender.map((task) => (
            <tr key={task._id}>
              <td className="py-2 px-4 border-b">{task.companyName}</td>
              <td className="py-2 px-4 border-b">{task.driverName || 'N/A'}</td>
              <td className="py-2 px-4 border-b">{task.dispatcher?.name || 'N/A'}</td>
              <td className="py-2 px-4 border-b">${task.offerRate || 'N/A'}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    task.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 
                    'bg-green-100 text-green-800'
                }`}>
                    {task.status}
                </span>
              </td>
              <td className="py-2 px-4 border-b">
                <button
                  onClick={() => setSelectedTask(task)}
                  className="text-indigo-600 hover:text-indigo-900 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="text-center py-4">No history found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-red-500 text-center mt-8">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Assignments</h1>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('current')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'current'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current Tasks
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mt-4">
        {activeTab === 'current' ? renderCurrentTasksTable(currentTasks) : renderHistoryTable(historyTasks)}
      </div>
      
      {selectedTask && <SubmittedTaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
};