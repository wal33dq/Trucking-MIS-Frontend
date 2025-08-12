import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task, User, Role } from '../types';
import { getTaskById, submitTask, findUsersByRole } from '../api';

export const AgentTaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [dispatchers, setDispatchers] = useState<User[]>([]);
  
  // State for form fields (excluding files)
  const [formData, setFormData] = useState({
    driverName: '',
    workingDate: '',
    offerRate: '',
    weight: '',
    callTime: '',
    comments: '',
    dispatcherId: '',
    truckType: '',
  });

  // New state for handling file uploads and related errors
  const [documents, setDocuments] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Constants for file validation
  const MAX_FILES = 5;
  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const taskRes = await getTaskById(id);
        setTask(taskRes.data);
        const dispatcherRes = await findUsersByRole(Role.Dispatcher);
        setDispatchers(dispatcherRes.data);
        if (dispatcherRes.data.length > 0) {
            setFormData(prev => ({ ...prev, dispatcherId: dispatcherRes.data[0]._id }));
        }
      } catch (err) {
        setError('Failed to fetch data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Handles changes for standard text inputs, textareas, and selects
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handles file selection, validation, and state update
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setFileError('');
    const newFiles = Array.from(files);

    // Validate total number of files
    if (documents.length + newFiles.length > MAX_FILES) {
        setFileError(`You can only upload a maximum of ${MAX_FILES} documents.`);
        return;
    }

    // Validate size of each file
    const oversizedFiles = newFiles.filter(file => file.size > MAX_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
        const oversizedFileNames = oversizedFiles.map(f => f.name).join(', ');
        setFileError(`File(s) "${oversizedFileNames}" exceed the ${MAX_SIZE_MB}MB size limit.`);
        return;
    }

    setDocuments(prev => [...prev, ...newFiles]);
  };
  
  // Removes a selected file from the list
  const removeFile = (indexToRemove: number) => {
    setDocuments(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  // Handles form submission with multipart/form-data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    // Reset errors
    setError('');
    setFileError('');

    // Basic validation
    if (documents.length === 0) {
        setFileError('Please upload at least one document.');
        return;
    }

    setSubmitting(true);

    // Use FormData to send files and other form data
    const submissionData = new FormData();

    // Append all text-based form fields
    Object.entries(formData).forEach(([key, value]) => {
        submissionData.append(key, value);
    });

    // Append all selected files
    documents.forEach(file => {
        submissionData.append('documents', file); // API will receive an array of files under the 'documents' key
    });

    try {
      // The `submitTask` function in your api.ts must be able to handle FormData
      await submitTask(id, submissionData);
      navigate('/sale-agent');
    } catch (err) {
      setError('Failed to submit task.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-red-500 text-center mt-8">{error}</p>;
  if (!task) return <p className="text-center mt-8">Task not found.</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Task Details</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        {/* Task Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div><h3 className="font-bold">MC Number:</h3> <p>{task.mcNumber}</p></div>
            <div><h3 className="font-bold">Company Name:</h3> <p>{task.companyName}</p></div>
            <div><h3 className="font-bold">Address:</h3> <p>{task.address}</p></div>
            <div><h3 className="font-bold">Email:</h3> <p>{task.email}</p></div>
            <div><h3 className="font-bold">Phone:</h3> <p>{task.phone}</p></div>
        </div>
        <hr className="my-6"/>
        <h2 className="text-2xl font-bold mb-4">Submit Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form fields */}
            <div>
                <label className="block text-gray-700">Driver Name</label>
                <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} className="w-full p-2 border rounded" required/>
            </div>
            <div>
                <label className="block text-gray-700">Working Date</label>
                <input type="date" name="workingDate" value={formData.workingDate} onChange={handleChange} className="w-full p-2 border rounded" required/>
            </div>
            <div>
                <label className="block text-gray-700">Offer Rate</label>
                <input type="number" name="offerRate" value={formData.offerRate} onChange={handleChange} className="w-full p-2 border rounded" required/>
            </div>
            <div>
                <label className="block text-gray-700">Weight</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full p-2 border rounded" required/>
            </div>
            <div>
                <label className="block text-gray-700">Truck Type</label>
                <input type="text" name="truckType" value={formData.truckType} onChange={handleChange} className="w-full p-2 border rounded" required/>
            </div>
            <div>
                <label className="block text-gray-700">Call Time</label>
                <input type="time" name="callTime" value={formData.callTime} onChange={handleChange} className="w-full p-2 border rounded" required/>
            </div>
            {/* New File Upload Section */}
            <div>
                <label className="block text-gray-700">Upload Documents (Max 5, up to 10MB each)</label>
                <input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange} 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
                {fileError && <p className="text-red-500 text-sm mt-1">{fileError}</p>}
                {/* Display selected files */}
                <div className="mt-2 space-y-2">
                    {documents.map((file, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                            <span className="text-sm font-medium text-gray-700">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 font-bold text-lg leading-none">&times;</button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="md:col-span-2">
                <label className="block text-gray-700">Comments</label>
                <textarea name="comments" value={formData.comments} onChange={handleChange} className="w-full p-2 border rounded"></textarea>
            </div>
            <div className="md:col-span-2">
                <label className="block text-gray-700">Assign to Dispatcher</label>
                <select name="dispatcherId" value={formData.dispatcherId} onChange={handleChange} className="w-full p-2 border rounded" required>
                    <option value="" disabled>Select a dispatcher</option>
                    {dispatchers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
            </div>
        </div>
        <button type="submit" className="mt-6 w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit to Dispatcher'}
        </button>
      </form>
    </div>
  );
};
