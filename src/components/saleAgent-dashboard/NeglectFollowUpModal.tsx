// src/components/NeglectFollowUpModal.tsx
import React, { useState } from 'react';
import { Task } from '../../types';
import { neglectTask, followUpTask } from '../../api'; // Assuming api functions are in ../api

interface NeglectFollowUpModalProps {
    task: Task;
    onClose: () => void;
    onSuccess: () => void;
}

export const NeglectFollowUpModal = ({ task, onClose, onSuccess }: NeglectFollowUpModalProps) => {
    const [comment, setComment] = useState('');
    const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState<'neglect' | 'follow-up' | false>(false);
    const [error, setError] = useState('');
    const prefilledComments = ["On a voicemail", "Hang-Up", "Not responding", "not interested"];

    const handleNeglect = async () => {
        if (!comment.trim()) {
            setError('A comment is required to neglect this task.');
            return;
        }
        setSubmitting('neglect');
        setError('');
        try {
            await neglectTask(task._id, comment);
            onSuccess();
        } catch (err) {
            setError('Failed to neglect task. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFollowUp = async () => {
        if (!comment.trim()) {
            setError('A comment is required for the follow-up.');
            return;
        }
        if (!followUpDate) {
            setError('A follow-up date is required.');
            return;
        }
        setSubmitting('follow-up');
        setError('');
        try {
            await followUpTask(task._id, comment, followUpDate);
            onSuccess();
        } catch (err) {
            setError('Failed to set follow-up. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Update Task Status</h2>
                <p className="mb-6 text-gray-500">For: <strong className="text-indigo-600">{task.companyName}</strong></p>
                <form onSubmit={(e) => e.preventDefault()}>
                    {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2 font-semibold">Comment</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                            rows={4}
                            placeholder="e.g., Driver did not respond. Will call again."
                            required
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {prefilledComments.map((text) => (
                                <button
                                    key={text}
                                    type="button"
                                    onClick={() => setComment(text)}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2 font-semibold">Follow-up Date</label>
                        <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold">Cancel</button>
                        <button
                            type="button"
                            onClick={handleNeglect}
                            className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold shadow-md disabled:bg-gray-400"
                            disabled={!!submitting}
                        >
                            {submitting === 'neglect' ? 'Saving...' : 'Confirm Neglect'}
                        </button>
                         <button
                            type="button"
                            onClick={handleFollowUp}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-md disabled:bg-gray-400"
                            disabled={!!submitting}
                        >
                            {submitting === 'follow-up' ? 'Saving...' : 'Follow Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
