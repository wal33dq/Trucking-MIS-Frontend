import React from 'react';
import { Task, User } from '../../types';
import { UserIcon, DollarSignIcon } from './Icons';

interface ActionRequiredTasksProps {
    tasksToRender: Task[];
    selectedTasks: Set<string>;
    isDeleting: boolean;
    handleSelectAll: () => void;
    setShowDeleteConfirmation: (show: boolean) => void;
    handleSelectTask: (taskId: string) => void;
    setViewingTask: (task: Task | null) => void;
    setSelectedTaskForAssign: (task: Task | null) => void;
    setTaskToDelete: (task: Task | null) => void;
    setSelectedTaskForReassign: (task: Task | null) => void;
    setSelectedTaskForFollowUp: (task: Task | null) => void;
}

export const ActionRequiredTasks = ({
    tasksToRender,
    selectedTasks,
    isDeleting,
    handleSelectAll,
    setShowDeleteConfirmation,
    handleSelectTask,
    setViewingTask,
    setSelectedTaskForAssign,
    setTaskToDelete,
    setSelectedTaskForReassign,
    setSelectedTaskForFollowUp,
}: ActionRequiredTasksProps) => {
    return (
        <div className="space-y-4">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        onChange={handleSelectAll}
                        checked={tasksToRender.length > 0 && selectedTasks.size === tasksToRender.length}
                        disabled={tasksToRender.length === 0}
                    />
                    <label className="ml-3 text-sm font-medium text-gray-700">
                        Select All
                    </label>
                </div>
                {selectedTasks.size > 0 && (
                     <button
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold shadow-sm hover:shadow-md transition text-sm disabled:bg-red-400"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : `Delete Selected (${selectedTasks.size})`}
                    </button>
                )}
            </div>

            {tasksToRender.length > 0 ? tasksToRender.map((task: Task) => (
                <div key={task._id} className={`p-5 rounded-xl shadow-md border hover:shadow-lg hover:border-indigo-300 transition-all duration-300 flex items-start space-x-4 ${selectedTasks.has(task._id) ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200'}`}>
                    <input
                        type="checkbox"
                        className="h-5 w-5 mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedTasks.has(task._id)}
                        onChange={() => handleSelectTask(task._id)}
                    />
                    <div className="flex-grow">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="mb-4 md:mb-0">
                                <h3 className="text-lg font-bold text-gray-800">{task.companyName}</h3>
                                <p className="text-sm text-gray-500">{task.mcNumber}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => setViewingTask(task)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition text-sm">View Details</button>
                                {task.status === 'assigned' && (
                                    <>
                                        <button onClick={() => setSelectedTaskForReassign(task)} className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-semibold shadow-sm hover:shadow-md transition text-sm">Re-assign</button>
                                        <button onClick={() => setTaskToDelete(task)} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold shadow-sm hover:shadow-md transition text-sm">Delete</button>
                                    </>
                                )}
                                {task.status === 'submitted' && (
                                    <>
                                        <button onClick={() => setSelectedTaskForAssign(task)} className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 font-semibold shadow-sm hover:shadow-md transition text-sm">Assign</button>
                                        <button onClick={() => setTaskToDelete(task)} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold shadow-sm hover:shadow-md transition text-sm">Delete</button>
                                    </>
                                )}
                                {task.status === 'neglected' && (
                                <>
                                    <button onClick={() => setSelectedTaskForReassign(task)} className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-semibold shadow-sm hover:shadow-md transition text-sm">Re-assign</button>
                                    <button onClick={() => setSelectedTaskForFollowUp(task)} className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 font-semibold shadow-sm hover:shadow-md transition text-sm">Follow-up</button>
                                    <button onClick={() => setTaskToDelete(task)} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold shadow-sm hover:shadow-md transition text-sm">Delete</button>
                                </>
                                )}
                                {task.status === 'follow-up' && (
                                    <>
                                        <button onClick={() => setSelectedTaskForReassign(task)} className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-semibold shadow-sm hover:shadow-md transition text-sm">Re-assign</button>
                                        <button onClick={() => setSelectedTaskForAssign(task)} className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 font-semibold shadow-sm hover:shadow-md transition text-sm">Assign</button>
                                        <button onClick={() => setTaskToDelete(task)} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold shadow-sm hover:shadow-md transition text-sm">Delete</button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="border-t border-gray-200 my-4"></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-gray-600"><UserIcon /> <div><span className="font-semibold">Agent:</span> {(task.saleAgent as User)?.name || 'N/A'}</div></div>
                            <div className="flex items-center text-gray-600"><UserIcon /> <div><span className="font-semibold">Driver:</span> {task.driverName || 'N/A'}</div></div>
                            <div className="flex items-center text-gray-600"><DollarSignIcon /> <div><span className="font-semibold">Rate:</span> {task.offerRate ? `%${task.offerRate}` : 'N/A'}</div></div>
                            <div className="flex items-center">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                                    task.status === 'assigned' ? 'bg-gray-100 text-gray-800' :
                                    task.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' : 
                                    task.status === 'neglected' ? 'bg-red-100 text-red-800' :
                                    task.status === 'follow-up' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'}`}>{task.status?.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-700">No Tasks Require Action</h3>
                    <p className="text-gray-500 mt-2">No tasks found for this agent with this status.</p>
                </div>
            )}
        </div>
    );
};

