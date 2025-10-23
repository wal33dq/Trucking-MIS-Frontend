// src/components/SubmittedTaskDetailModal.tsx
import React from 'react';
import { SubmittedTask, Document } from '../../types';

interface SubmittedTaskDetailModalProps {
    task: SubmittedTask;
    onClose: () => void;
}

export const SubmittedTaskDetailModal = ({ task, onClose }: SubmittedTaskDetailModalProps) => {
    if (!task) return null;

    const assignedUser = task.dispatcher;

    const handleDocumentClick = (url: string) => {
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Error opening document:', error);
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
                    <div><p className="font-semibold text-gray-600">Offer Rate:</p> <p className="text-gray-900">{task.offerRate ? `${task.offerRate}%` : 'N/A'}</p></div>
                    <div><p className="font-semibold text-gray-600">Working Date:</p> <p className="text-gray-900">{task.workingDate ? new Date(task.workingDate).toLocaleDateString() : 'N/A'}</p></div>
                    <div><p className="font-semibold text-gray-600">Call Time:</p> <p className="text-gray-900">{task.callTime || 'N/A'}</p></div>
                    <div><p className="font-semibold text-gray-600">Weight:</p> <p className="text-gray-900">{task.weight ? `${task.weight} lbs` : 'N/A'}</p></div>
                    <div><p className="font-semibold text-gray-600">Assigned Project Divider:</p> <p className="text-gray-900">{assignedUser?.name || 'N/A'}</p></div>
                    {task.followUpDate && (
                         <div><p className="font-semibold text-gray-600">Follow-up Date:</p> <p className="text-gray-900">{new Date(task.followUpDate).toLocaleDateString()}</p></div>
                    )}
                    <div className="md:col-span-2">
                        <p className="font-semibold text-gray-600">Comments:</p>
                        <p className="bg-gray-50 p-3 rounded-md mt-1 border text-gray-800">{task.comments || 'No comments provided.'}</p>
                    </div>
                    {task.statusUpdateComment && (
                        <div className="md:col-span-2">
                            <p className="font-semibold text-gray-600">Reason for '{task.status}' status:</p>
                            <p className="bg-yellow-50 p-3 rounded-md mt-1 border border-yellow-200 text-gray-800">{task.statusUpdateComment}</p>
                        </div>
                    )}
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
