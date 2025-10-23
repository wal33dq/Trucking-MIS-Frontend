import React, { useState } from 'react';
import { User } from '../../types';
import { uploadTasks } from '../../api';

interface UploadTasksFormProps {
    saleAgents: User[];
}

export const UploadTasksForm = ({ saleAgents }: UploadTasksFormProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploadError, setUploadError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setSuccess('');
            setUploadError('');
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !saleAgents.length) {
            setUploadError('Please select a sale agent and a file.');
            return;
        }
        const form = e.target as HTMLFormElement;
        const select = form.querySelector('select');
        const selectedAgentId = select?.value;

        if (!selectedAgentId) {
            setUploadError('Please select a sale agent.');
            return;
        }

        setUploading(true);
        setUploadError('');
        try {
            await uploadTasks(selectedAgentId, file);
            setSuccess('Tasks uploaded successfully!');
            setFile(null);
            form.reset();
        } catch (err) {
            setUploadError('Failed to upload tasks.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-xl mx-auto border border-gray-200">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Assign Tasks via CSV</h2>
            <p className="text-gray-500 mb-6">Select a sale agent and upload a CSV file to bulk-assign tasks.</p>
            <form onSubmit={handleUpload}>
                {uploadError && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{uploadError}</p>}
                {success && <p className="text-green-500 text-sm mb-4 bg-green-50 p-3 rounded-lg">{success}</p>}
                <div className="mb-6">
                    <label className="block text-gray-700 mb-2 font-semibold">Assign to Sale Agent</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" defaultValue="" required>
                        <option value="" disabled>Select an agent</option>
                        {saleAgents.map((agent: User) => (<option key={agent._id} value={agent._id}>{agent.name}</option>))}
                    </select>
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 mb-2 font-semibold">Upload CSV File</label>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                        <div className="text-center">
                             <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                            </svg>
                            <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                                    <span>{file ? file.name : 'Upload a file'}</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} required />
                                </label>
                                <p className="pl-1">{!file && 'or drag and drop'}</p>
                            </div>
                            <p className="text-xs leading-5 text-gray-600">CSV up to 10MB</p>
                        </div>
                    </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 shadow-md hover:shadow-lg transition disabled:bg-gray-400" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload and Assign'}
                </button>
            </form>
        </div>
    );
};
