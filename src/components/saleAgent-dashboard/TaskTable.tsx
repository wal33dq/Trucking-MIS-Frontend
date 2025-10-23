// src/components/TaskTable.tsx
import React from 'react';
import { SubmittedTask, Task } from '../../types';

interface TaskTableProps {
    tasks: SubmittedTask[];
    tableType: 'current' | 'history' | 'follow-up' | 'draft';
    onViewDetails: (task: SubmittedTask) => void;
    onSubmitInfo: (task: Task) => void;
    onNeglect: (task: Task) => void;
    onViewAddress: (address: string) => void;
    onViewEmail: (email: string) => void;
}

// NO CHANGES WERE NEEDED TO THIS FILE
// It was already designed to just render the `tasks` prop it receives.
export const TaskTable = ({ tasks, tableType, onViewDetails, onSubmitInfo, onNeglect, onViewAddress, onViewEmail }: TaskTableProps) => {
    
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'assigned': return 'bg-yellow-100 text-yellow-800';
            case 'submitted': return 'bg-blue-100 text-blue-800';
            case 'neglected': return 'bg-red-100 text-red-800';
            case 'follow-up': return 'bg-purple-100 text-purple-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'draft': return 'bg-gray-200 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MC Number</th>
                <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                {tableType === 'follow-up' ? (
                    <>
                        <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow-up Date</th>
                        <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                    </>
                ) : (
                    <>
                        <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    </>
                )}
                <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tableType === 'history' ? 'Phone' : 'Phone'}</th>
                <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tableType === 'history' ? 'Date Time' : 'Status'}</th>
                {tableType === 'history' && <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>}
                <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.length > 0 ? tasks.map((task) => (
                <tr key={task._id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.mcNumber}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{task.companyName}</td>
                  {tableType === 'follow-up' ? (
                      <>
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{task.followUpDate ? new Date(task.followUpDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{task.statusUpdateComment}</td>
                      </>
                  ) : (
                      <>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                          {task.address && (
                            <button 
                                onClick={() => onViewAddress(task.address || '')} 
                                className="text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none"
                            >
                              {task.address.length > 10
                                ? `${task.address.substring(0, 10)}...`
                                : task.address}
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                          {task.email && (
                            <button 
                                onClick={() => onViewEmail(task.email || '')} 
                                className="text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none"
                            >
                              {task.email.length > 10
                                ? `${task.email.substring(0, 10)}...`
                                : task.email}
                            </button>
                          )}</td>
                      </>
                  )}
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{task.phone}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                    {tableType === 'history' ? (task.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'N/A') : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(task.status)}`}>
                          {task.status?.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  {tableType === 'history' && (
                    <td className="py-4 px-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(task.status)}`}>
                            {task.status}
                        </span>
                    </td>
                  )}
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                    {tableType === 'current' ? (
                      <div className="flex items-center gap-4">
                        <button onClick={() => onSubmitInfo(task)} className="text-indigo-600 hover:text-indigo-900">Submit Info</button>
                        <button onClick={() => onNeglect(task)} className="text-red-600 hover:text-red-900">Neglect</button>
                      </div>
                    ) : tableType === 'follow-up' ? (
                      <div className="flex items-center gap-4">
                        <button onClick={() => onSubmitInfo(task)} className="text-indigo-600 hover:text-indigo-900">Re-submit Info</button>
                        <button onClick={() => onNeglect(task)} className="text-red-600 hover:text-red-900">Update Status</button>
                      </div>
                    ) : tableType === 'draft' ? (
                        <div className="flex items-center gap-4">
                            <button onClick={() => onSubmitInfo(task)} className="text-indigo-600 hover:text-indigo-900">Continue Editing</button>
                            <button onClick={() => onNeglect(task)} className="text-red-600 hover:text-red-900">Neglect</button>
                      </div>
                    ) : (
                      <button onClick={() => onViewDetails(task)} className="text-indigo-600 hover:text-indigo-900">View Details</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={tableType === 'history' ? 8 : 7} className="text-center py-8 text-gray-500">No tasks found for this category.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
};
