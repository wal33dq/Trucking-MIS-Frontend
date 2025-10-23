// src/components/TaskSubmissionModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Task, User, Role } from '../../types';
import { findUsersByRole, submitTask, saveTaskDraft } from '../../api';

interface TaskSubmissionModalProps {
    task: Task;
    onClose: () => void;
    onSuccess: () => void;
}

export const TaskSubmissionModal = ({ task, onClose, onSuccess }: TaskSubmissionModalProps) => {
    const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
    const [formData, setFormData] = useState({
        driverName: '',
        workingDate: new Date().toISOString().split('T')[0],
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
        const fetchProjectDividers = async () => {
            try {
                const userRes = await findUsersByRole(Role.ProjectDivider);
                setAssignableUsers(userRes.data);
                 if (task.status !== 'draft' && userRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, dispatcherId: userRes.data[0]._id }));
                }
            } catch (err) {
                setApiError('Failed to fetch project dividers.');
                console.error(err);
            }
        };
        fetchProjectDividers();
    }, [task]);
    
    useEffect(() => {
        if (task) {
            setFormData({
                driverName: task.driverName || '',
                workingDate: task.workingDate ? new Date(task.workingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                offerRate: task.offerRate?.toString() || '',
                weight: task.weight?.toString() || '',
                callTime: task.callTime || '',
                comments: task.comments || '',
                dispatcherId: (typeof task.dispatcher === 'object' ? task.dispatcher?._id : task.dispatcher) || (assignableUsers.length > 0 ? assignableUsers[0]._id : ''),
                truckType: task.truckType || '',
            });
        }
    }, [task, assignableUsers]);

    const isFormFullyValid = useMemo(() => {
        return (
            formData.driverName.trim() &&
            formData.workingDate &&
            formData.offerRate && !isNaN(Number(formData.offerRate)) && Number(formData.offerRate) > 0 &&
            formData.weight && !isNaN(Number(formData.weight)) && Number(formData.weight) > 0 &&
            formData.truckType.trim() &&
            formData.callTime &&
            formData.dispatcherId &&
            documents.length > 0
        );
    }, [formData, documents]);

    const hasSomeData = useMemo(() => {
         return Object.values(formData).some(v => v !== '' && v !== null) || documents.length > 0
    }, [formData, documents]);

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
        if (!formData.dispatcherId) errors.dispatcherId = 'Please select a project divider.';
        if (documents.length === 0) setFileError('At least one document is required.');
        else setFileError('');

        setFormErrors(errors);
        return Object.keys(errors).length === 0 && documents.length > 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    const handleSaveDraft = async () => {
        setSubmitting(true);
        setApiError('');
        
        const { dispatcherId, ...restOfFormData } = formData;
        const draftData = {
            ...restOfFormData,
            dispatcher: dispatcherId, // Remap for backend schema
        };

        try {
            await saveTaskDraft(task._id, draftData);
            onSuccess();
        } catch (err) {
            setApiError('Failed to save draft. Please try again.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
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
            onSuccess();
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
                        {/* Form Fields */}
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
                            <label className="block text-sm font-medium text-gray-700">Offer Rate (%)</label>
                            <input type="number" name="offerRate" placeholder="e.g., 4" value={formData.offerRate} onChange={handleChange} className={`mt-1 w-full p-2 border rounded-md shadow-sm ${formErrors.offerRate ? 'border-red-500' : 'border-gray-300'}`} />
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
                            <label className="block text-sm font-medium text-gray-700">Assign to Project Divider</label>
                            <select name="dispatcherId" value={formData.dispatcherId} onChange={handleChange} className={`mt-1 w-full p-2 border rounded-md shadow-sm ${formErrors.dispatcherId ? 'border-red-500' : 'border-gray-300'}`} >
                                <option value="" disabled>Select a project divider...</option>
                                {assignableUsers.map(user => <option key={user._id} value={user._id}>{user.name}</option>)}
                            </select>
                            {formErrors.dispatcherId && <p className="text-red-500 text-xs mt-1">{formErrors.dispatcherId}</p>}
                        </div>
                    </div>
                    {apiError && <p className="text-red-600 bg-red-100 p-3 rounded-md text-center mt-4">{apiError}</p>}
                    <div className="mt-6 pt-4 border-t flex items-center gap-x-4">
                        <button 
                            type="button"
                            onClick={handleSaveDraft}
                            className="w-full bg-gray-500 text-white p-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            disabled={submitting || !hasSomeData}
                        >
                            Save as Draft
                        </button>
                        <button 
                            type="submit" 
                            className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex justify-center items-center" 
                            disabled={submitting || !isFormFullyValid}
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : 'Submit to Project Divider'} 
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

