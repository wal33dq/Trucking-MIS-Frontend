// src/components/EmailModal.tsx
import React, { useState } from 'react';

interface EmailModalProps {
    email: string;
    onClose: () => void;
}

export const EmailModal = ({ email, onClose }: EmailModalProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const textArea = document.createElement("textarea");
        textArea.value = email;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textArea);
    };

    if (!email) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-light">&times;</button>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Full Email</h3>
                <div className="bg-gray-100 p-4 rounded-md mb-4 text-gray-700 break-words">
                    {email}
                </div>
                <button
                    onClick={handleCopy}
                    className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                >
                    {copied ? 'Copied!' : 'Copy Email'}
                </button>
            </div>
        </div>
    );
};
