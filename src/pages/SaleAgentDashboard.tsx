import React, { useState, useEffect, useCallback } from 'react';
import { Task, User, Role } from '../types';
import { getMyAssignments, submitTask, findUsersByRole } from '../api';

const BACKEND_BASE_URL = 'https://api.theonellc.com';

// Interface for documents, used in both modals
interface Document {
    name: string;
    url: string;
}

// Interface for tasks with populated dispatcher and document info
interface SubmittedTask extends Task {
    dispatcher?: User;
    documents?: Document[];
    documentUrls?: string[];
}

// =================================================================================
// MODAL FOR VIEWING SUBMITTED TASK DETAILS (Existing, slightly styled)
// =================================================================================
const SubmittedTaskDetailModal = ({ task, onClose }: { task: SubmittedTask, onClose: () => void }) => {
    if (!task) return null;
    const dispatcher = task.dispatcher;

    const handleDocumentClick = (url: string) => {
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Error opening document:', error);
            // In-app feedback instead of alert
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl font-light">&times;</button>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Details for {task.companyName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div><p className="font-semibold text-gray-600">Driver Name:</p> <p className="text-gray-900">{task.driverName || 'N/A'}</p></div>
                    <div><p className="font-semibold text-gray-600">Truck Type:</p> <p className="text-gray-900">{task.truckType || 'N/A'}</p></div>
                    <div><p className="font-semibold text-gray-600">Offer Rate:</p> <p className="text-gray-900">${task.offerRate || 'N/A'}</p></div>
                    <div><p className="font-semibold text-gray-600">Working Date:</p> <p className="text-gray-900">{task.workingDate ? new Date(task.workingDate).toLocaleDateString() : 'N/A'}</p></div>
                    <div><p className="font-semibold text-gray-600">Call Time:</p> <p className="text-gray-900">{task.callTime || 'N/A'}</p></div>
                    <div><p className="font-semibold text-gray-600">Weight:</p> <p className="text-gray-900">{task.weight ? `${task.weight} lbs` : 'N/A'}</p></div>
                    <div><p className="font-semibold text-gray-600">Assigned Dispatcher:</p> <p className="text-gray-900">{dispatcher?.name || 'N/A'}</p></div>
                    <div className="md:col-span-2">
                        <p className="font-semibold text-gray-600">Comments:</p>
                        <p className="bg-gray-50 p-3 rounded-md mt-1 border text-gray-800">{task.comments || 'No comments provided.'}</p>
                    </div>
                    <div className="md:col-span-2">
                        <p className="font-semibold text-gray-600">Submitted Documents:</p>
                        <ul className="list-disc list-inside bg-gray-50 p-4 rounded-md mt-1 border">
                            {task.documents && task.documents.length > 0 ? task.documents.map((doc: Document, index: number) => (
                                <li key={index} className="text-gray-800">
                                    <button
                                        onClick={() => handleDocumentClick(doc.url)}
                                        className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200"
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


// =================================================================================
// NEW MODAL FOR SUBMITTING TASK INFO (Replaces AgentTaskDetail.tsx)
// =================================================================================
const TaskSubmissionModal = ({ task, onClose, onSuccess }: { task: Task, onClose: () => void, onSuccess: () => void }) => {
    const [dispatchers, setDispatchers] = useState<User[]>([]);
    const [formData, setFormData] = useState({
        driverName: '',
        workingDate: new Date().toISOString().split('T')[0], // Auto-pick current date
        offerRate: '',
        weight: '',
        callTime: '',
        comments: '',
        dispatcherId: '',
        truckType: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [documents, setDocuments] = useState<File[]>([]);
    const [fileError, setFileError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const MAX_FILES = 5;
    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    useEffect(() => {
        const fetchDispatchers = async () => {
            try {
                const dispatcherRes = await findUsersByRole(Role.Dispatcher);
                setDispatchers(dispatcherRes.data);
                if (dispatcherRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, dispatcherId: dispatcherRes.data[0]._id }));
                }
            } catch (err) {
                setApiError('Failed to fetch dispatchers.');
                console.error(err);
            }
        };
        fetchDispatchers();
    }, []);
    
    // --- Form Validation ---
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.driverName.trim()) errors.driverName = 'Driver name is required.';
        if (!formData.workingDate) errors.workingDate = 'Working date is required.';
        if (!formData.offerRate) errors.offerRate = 'Offer rate is required.';
        else if (isNaN(Number(formData.offerRate)) || Number(formData.offerRate) <= 0) errors.offerRate = 'Offer rate must be a positive number.';
        if (!formData.weight) errors.weight = 'Weight is required.';
        else if (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) errors.weight = 'Weight must be a positive number.';
        if (!formData.truckType.trim()) errors.truckType = 'Truck type is required.';
        if (!formData.callTime) errors.callTime = 'Call time is required.';
        if (!formData.dispatcherId) errors.dispatcherId = 'Please select a dispatcher.';
        if (documents.length === 0) setFileError('At least one document is required.');
        else setFileError('');

        setFormErrors(errors);
        return Object.keys(errors).length === 0 && documents.length > 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error on change
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setFileError('');
        const newFiles = Array.from(files);
        let error = '';

        if (documents.length + newFiles.length > MAX_FILES) {
            error = `You can only upload a maximum of ${MAX_FILES} documents.`;
        } else {
            const oversizedFiles = newFiles.filter(file => file.size > MAX_SIZE_BYTES);
            if (oversizedFiles.length > 0) {
                error = `File(s) exceed the ${MAX_SIZE_MB}MB size limit.`;
            }
        }
        
        if (error) {
            setFileError(error);
            return;
        }

        setDocuments(prev => [...prev, ...newFiles]);
    };
    
    const removeFile = (indexToRemove: number) => {
        setDocuments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError('');
        
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        const submissionData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            submissionData.append(key, value);
        });
        documents.forEach(file => {
            submissionData.append('documents', file);
        });

        try {
            await submitTask(task._id, submissionData);
            onSuccess(); // Call success callback from props
        } catch (err) {
            setApiError('Failed to submit task. Please try again.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl font-light">&times;</button>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">Submit Information</h2>
                <p className="text-gray-500 mb-6 border-b pb-4">For {task.companyName} (MC: {task.mcNumber})</p>
                
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-150px)] pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {/* Form fields */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Driver Name</label>
                            <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} className={`mt-1 w-full p-2 border rounded-md shadow-sm ${formErrors.driverName ? 'border-red-500' : 'border-gray-300'}`} />
                            {formErrors.driverName && <p className="text-red-500 text-xs mt-1">{formErrors.driverName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Working Date</label>
                            <input type="date" name="workingDate" value={formData.workingDate} onChange={handleChange} className={`mt-1 w-full p-2 border rounded-md shadow-sm ${formErrors.workingDate ? 'border-red-500' : 'border-gray-300'}`} />
                            {formErrors.workingDate && <p className="text-red-500 text-xs mt-1">{formErrors.workingDate}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Offer Rate ($)</label>
                            <input type="number" name="offerRate" placeholder="e.g., 1500" value={formData.offerRate} onChange={handleChange} className={`mt-1 w-full p-2 border rounded-md shadow-sm ${formErrors.offerRate ? 'border-red-500' : 'border-gray-300'}`} />
                            {formErrors.offerRate && <p className="text-red-500 text-xs mt-1">{formErrors.offerRate}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Weight (lbs)</label>
                            <input type="number" name="weight" placeholder="e.g., 45000" value={formData.weight} onChange={handleChange} className={`mt-1 w-full p-2 border rounded-md shadow-sm ${formErrors.weight ? 'border-red-500' : 'border-gray-300'}`} />
                            {formErrors.weight && <p className="text-red-500 text-xs mt-1">{formErrors.weight}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Truck Type</label>
                            <input type="text" name="truckType" placeholder="e.g., Dry Van" value={formData.truckType} onChange={handleChange} className={`mt-1 w-full p-2 border rounded-md shadow-sm ${formErrors.truckType ? 'border-red-500' : 'border-gray-300'}`} />
                            {formErrors.truckType && <p className="text-red-500 text-xs mt-1">{formErrors.truckType}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Call Time</label>
                            <input type="time" name="callTime" value={formData.callTime} onChange={handleChange} className={`mt-1 w-full p-2 border rounded-md shadow-sm ${formErrors.callTime ? 'border-red-500' : 'border-gray-300'}`} />
                            {formErrors.callTime && <p className="text-red-500 text-xs mt-1">{formErrors.callTime}</p>}
                        </div>
                        
                        {/* File Upload Section */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Upload Documents</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                            <span>Upload files</span>
                                            <input id="file-upload" name="file-upload" type="file" multiple onChange={handleFileChange} className="sr-only" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx, .mp3" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">Max {MAX_FILES} files, up to {MAX_SIZE_MB}MB each</p>
                                </div>
                            </div>
                            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
                            <div className="mt-2 space-y-2">
                                {documents.map((file, index) => (
                                    <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-md text-sm">
                                        <span className="font-medium text-gray-700 truncate pr-2">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 font-bold text-xl leading-none">&times;</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Comments</label>
                            <textarea name="comments" value={formData.comments} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border rounded-md shadow-sm border-gray-300"></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Assign to Dispatcher</label>
                            <select name="dispatcherId" value={formData.dispatcherId} onChange={handleChange} className={`mt-1 w-full p-2 border rounded-md shadow-sm ${formErrors.dispatcherId ? 'border-red-500' : 'border-gray-300'}`} >
                                <option value="" disabled>Select a dispatcher...</option>
                                {dispatchers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                            {formErrors.dispatcherId && <p className="text-red-500 text-xs mt-1">{formErrors.dispatcherId}</p>}
                        </div>
                    </div>
                    {apiError && <p className="text-red-600 bg-red-100 p-3 rounded-md text-center mt-4">{apiError}</p>}
                    <div className="mt-6 pt-4 border-t">
                        <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : 'Submit to Dispatcher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// =================================================================================
// MAIN DASHBOARD COMPONENT
// =================================================================================
export const SaleAgentDashboard = () => {
  const [tasks, setTasks] = useState<SubmittedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  
  // State for controlling modals
  const [selectedTaskForView, setSelectedTaskForView] = useState<SubmittedTask | null>(null);
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMyAssignments();
      const processedData = response.data.map((task: SubmittedTask) => {
          let documents: Document[] = [];
          if (task.documentUrls && Array.isArray(task.documentUrls)) {
              documents = task.documentUrls.map((urlPath: string) => {
                  const filename = urlPath.split(/[\\/]/).pop() || 'Document';
                  const fullUrl = `${BACKEND_BASE_URL}/api/documents/${encodeURIComponent(filename)}`;
                  return { name: filename, url: fullUrl };
              });
          }
          return { ...task, documents };
      });
      setTasks(processedData);
    } catch (err) {
      setError('Failed to fetch assignments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const currentTasks = tasks.filter(task => task.status === 'assigned');
  const historyTasks = tasks.filter(task => task.status !== 'assigned');

  const handleSubmissionSuccess = () => {
      setSelectedTaskForSubmit(null);
      fetchTasks(); // Refresh the tasks list
  };

  const renderTaskTable = (tasksToRender: SubmittedTask[], isCurrent: boolean) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MC Number</th>
            <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
            <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
            <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{isCurrent ? 'Phone' : 'Driver Name'}</th>
            <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{isCurrent ? 'Status' : 'Dispatcher'}</th>
            {!isCurrent && <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>}
            <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasksToRender.length > 0 ? tasksToRender.map((task) => (
            <tr key={task._id} className="hover:bg-gray-50">
              <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.mcNumber}</td>
              <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{task.companyName}</td>
              <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{task.address}</td>
              <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{task.email}</td>
              <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{isCurrent ? task.phone : (task.driverName || 'N/A')}</td>
              <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                {isCurrent ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{task.status}</span>
                ) : (task.dispatcher?.name || 'N/A')}
              </td>
              {!isCurrent && (
                <td className="py-4 px-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>{task.status}</span>
                </td>
              )}
              <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                {isCurrent ? (
                  <button onClick={() => setSelectedTaskForSubmit(task)} className="text-indigo-600 hover:text-indigo-900">Submit Info</button>
                ) : (
                  <button onClick={() => setSelectedTaskForView(task)} className="text-indigo-600 hover:text-indigo-900">View Details</button>
                )}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={isCurrent ? 5 : 6} className="text-center py-8 text-gray-500">No {isCurrent ? 'current tasks' : 'history'} found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <div className="text-center mt-12">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-12 bg-red-100 p-4 rounded-md">{error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">My Assignments</h1>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('current')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'current' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Current Tasks ({currentTasks.length})
          </button>
          <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            History ({historyTasks.length})
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-md mt-4 overflow-hidden">
        {activeTab === 'current' ? renderTaskTable(currentTasks, true) : renderTaskTable(historyTasks, false)}
      </div>
      
      {/* Render Modals */}
      {selectedTaskForView && <SubmittedTaskDetailModal task={selectedTaskForView} onClose={() => setSelectedTaskForView(null)} />}
      {selectedTaskForSubmit && <TaskSubmissionModal task={selectedTaskForSubmit} onClose={() => setSelectedTaskForSubmit(null)} onSuccess={handleSubmissionSuccess} />}
    </div>
  );
};
