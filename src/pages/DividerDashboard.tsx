import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, Task } from '../types';
import { findUsersByRole, getDispatcherOverviewTasks, getTasksByAgentAndStatus, deleteTask, deleteMultipleTasks, getAgentTaskCounts } from '../api';
import { AssignToDispatcherModal, ReassignTaskModal, FollowUpModal, ViewTaskModal, DeleteConfirmationModal } from '../components/divider-dashboard/Modals';
import { UploadTasksForm } from '../components/divider-dashboard/UploadTasksForm';
import { ActionRequiredTasks } from '../components/divider-dashboard/ActionRequiredTasks';
import { DispatcherOverview } from '../components/divider-dashboard/DispatcherOverview';

export const DividerDashboard = () => {
    const [saleAgents, setSaleAgents] = useState<User[]>([]);
    const [dispatchers, setDispatchers] = useState<User[]>([]);
    
    const [mainActiveTab, setMainActiveTab] = useState('agents'); // 'agents', 'dispatchers', 'upload'
    const [agentReviewTab, setAgentReviewTab] = useState('assigned'); // 'assigned', 'submitted', 'neglected', 'follow-up'
    const [activeAgentId, setActiveAgentId] = useState('all');
    const [activeDispatcherId, setActiveDispatcherId] = useState('all');

    const [actionTasks, setActionTasks] = useState<Task[]>([]);
    const [dispatcherTasks, setDispatcherTasks] = useState<Task[]>([]);
    const [loadingActionTasks, setLoadingActionTasks] = useState(true);
    const [loadingDispatcherTasks, setLoadingDispatcherTasks] = useState(true);
    const [dispatcherError, setDispatcherError] = useState('');
    
    const [selectedTaskForAssign, setSelectedTaskForAssign] = useState<Task | null>(null);
    const [selectedTaskForReassign, setSelectedTaskForReassign] = useState<Task | null>(null);
    const [selectedTaskForFollowUp, setSelectedTaskForFollowUp] = useState<Task | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [agentTaskCounts, setAgentTaskCounts] = useState<Record<string, Record<string, number>>>({});

    const toggleExpanded = (taskId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
          case 'Scheduled': return 'bg-blue-100 text-blue-800';
          case 'In Transit': return 'bg-yellow-100 text-yellow-800';
          case 'Delivered': return 'bg-green-100 text-green-800';
          case 'Cancelled': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
        }
    };
      
    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Partial': return 'bg-blue-100 text-blue-800';
            case 'Overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    useEffect(() => {
        const isModalOpen = !!selectedTaskForAssign || !!selectedTaskForReassign || !!selectedTaskForFollowUp || !!viewingTask || !!taskToDelete || showDeleteConfirmation;
        document.body.style.overflow = isModalOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedTaskForAssign, selectedTaskForReassign, selectedTaskForFollowUp, viewingTask, taskToDelete, showDeleteConfirmation]);

    const fetchActionRequiredTasks = useCallback(async () => {
        setLoadingActionTasks(true);
        try {
            const response = await getTasksByAgentAndStatus(activeAgentId, agentReviewTab);
            setActionTasks(response.data);
        } catch (err) {
            // This error will be specific to this fetch, not shown in upload form
        } finally {
            setLoadingActionTasks(false);
        }
    }, [activeAgentId, agentReviewTab]);

    const fetchDispatcherData = useCallback(async () => {
        setLoadingDispatcherTasks(true);
        setDispatcherError('');
        try {
            const response = await getDispatcherOverviewTasks();
            setDispatcherTasks(response.data);
            if (response.data.length > 0) {
                const allTaskIds = new Set<string>(response.data.map((task: Task) => task._id));
                setExpandedRows(allTaskIds);
            }
        } catch (err) {
            setDispatcherError('Failed to fetch dispatcher tasks. Please try again.');
        } finally {
            setLoadingDispatcherTasks(false);
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [agentsRes, dispatchersRes, countsRes] = await Promise.all([
                    findUsersByRole(Role.SaleAgent),
                    findUsersByRole(Role.Dispatcher),
                    getAgentTaskCounts()
                ]);
                setSaleAgents(agentsRes.data);
                setDispatchers(dispatchersRes.data);
                setAgentTaskCounts(countsRes.data);
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            }
        };

        fetchInitialData();
        fetchDispatcherData();
    }, [fetchDispatcherData]);

    useEffect(() => {
        fetchActionRequiredTasks();
        setSelectedTasks(new Set());
    }, [activeAgentId, agentReviewTab, fetchActionRequiredTasks]);
    
    const handleDeleteTask = async () => {
        if (taskToDelete) {
            setIsDeleting(true);
            try {
                await deleteTask(taskToDelete._id);
                setTaskToDelete(null);
                fetchActionRequiredTasks();
            } catch (err) {
                // Handle delete error
            } finally {
                setIsDeleting(false);
            }
        } else if (selectedTasks.size > 0) {
            setIsDeleting(true);
            try {
                await deleteMultipleTasks(Array.from(selectedTasks));
                setSelectedTasks(new Set());
                setShowDeleteConfirmation(false);
                fetchActionRequiredTasks();
            } catch (err) {
                 // Handle delete error
            } finally {
                setIsDeleting(false);
            }
        }
    };
    
    const handleSelectTask = (taskId: string) => {
        setSelectedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedTasks.size === actionTasks.length) {
            setSelectedTasks(new Set());
        } else {
            setSelectedTasks(new Set(actionTasks.map(t => t._id)));
        }
    };
    
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Project Divider Dashboard</h1>
                        <p className="text-gray-500 mt-1">Manage, assign, and track all team tasks efficiently.</p>
                    </div>
                </header>

                <div className="mb-6">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 inline-flex space-x-2">
                        <button onClick={() => setMainActiveTab('agents')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${mainActiveTab === 'agents' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Sale Agent Review</button>
                        <button onClick={() => setMainActiveTab('dispatchers')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${mainActiveTab === 'dispatchers' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Dispatcher Overview</button>
                        <button onClick={() => setMainActiveTab('upload')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${mainActiveTab === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Upload Tasks</button>
                    </div>
                </div>
                
                {mainActiveTab === 'upload' && <UploadTasksForm saleAgents={saleAgents} />}

                {mainActiveTab === 'agents' && (
                    <div>
                        <div className="mb-4 flex space-x-2 border-b overflow-x-auto">
                            <button onClick={() => setActiveAgentId('all')} className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${activeAgentId === 'all' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                All Agents ({Object.values(agentTaskCounts).reduce((total, counts) => total + (counts.assigned || 0), 0)})
                            </button>
                            {saleAgents.map(agent => (
                                <button key={agent._id} onClick={() => setActiveAgentId(agent._id)} className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${activeAgentId === agent._id ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {agent.name} ({(agentTaskCounts[agent._id] && agentTaskCounts[agent._id].assigned) || 0})
                                </button>
                            ))}
                        </div>

                        <div className="mb-4 flex space-x-2 border-b">
                            <button onClick={() => setAgentReviewTab('assigned')} className={`py-2 px-4 text-sm font-medium ${agentReviewTab === 'assigned' ? 'border-b-2 border-gray-500 text-gray-600' : 'text-gray-500'}`}>Assigned</button>
                            <button onClick={() => setAgentReviewTab('submitted')} className={`py-2 px-4 text-sm font-medium ${agentReviewTab === 'submitted' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Submitted</button>
                            <button onClick={() => setAgentReviewTab('neglected')} className={`py-2 px-4 text-sm font-medium ${agentReviewTab === 'neglected' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500'}`}>Neglected</button>
                            <button onClick={() => setAgentReviewTab('follow-up')} className={`py-2 px-4 text-sm font-medium ${agentReviewTab === 'follow-up' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'}`}>Follow Up</button>
                        </div>
                        
                        {loadingActionTasks ? <p className="text-center py-8">Loading...</p> : 
                            <ActionRequiredTasks
                                tasksToRender={actionTasks}
                                selectedTasks={selectedTasks}
                                isDeleting={isDeleting}
                                handleSelectAll={handleSelectAll}
                                setShowDeleteConfirmation={setShowDeleteConfirmation}
                                handleSelectTask={handleSelectTask}
                                setViewingTask={setViewingTask}
                                setSelectedTaskForAssign={setSelectedTaskForAssign}
                                setTaskToDelete={setTaskToDelete}
                                setSelectedTaskForReassign={setSelectedTaskForReassign}
                                setSelectedTaskForFollowUp={setSelectedTaskForFollowUp}
                            />
                        }
                    </div>
                )}
                
                {mainActiveTab === 'dispatchers' && 
                    <DispatcherOverview
                        dispatchers={dispatchers}
                        activeDispatcherId={activeDispatcherId}
                        setActiveDispatcherId={setActiveDispatcherId}
                        dispatcherTasks={dispatcherTasks}
                        dispatcherError={dispatcherError}
                        loadingDispatcherTasks={loadingDispatcherTasks}
                        filteredDispatcherTasks={activeDispatcherId === 'all' ? dispatcherTasks : dispatcherTasks.filter(task => (task.dispatcher as User)?._id === activeDispatcherId)}
                        expandedRows={expandedRows}
                        toggleExpanded={toggleExpanded}
                        getStatusColor={getStatusColor}
                        getPaymentStatusColor={getPaymentStatusColor}
                    />
                }

                {selectedTaskForAssign && <AssignToDispatcherModal task={selectedTaskForAssign} onClose={() => setSelectedTaskForAssign(null)} onAssigned={fetchActionRequiredTasks} />}
                {selectedTaskForReassign && <ReassignTaskModal task={selectedTaskForReassign} onClose={() => setSelectedTaskForReassign(null)} onAssigned={fetchActionRequiredTasks} />}
                {selectedTaskForFollowUp && <FollowUpModal task={selectedTaskForFollowUp} onClose={() => setSelectedTaskForFollowUp(null)} onSuccess={fetchActionRequiredTasks} />}
                {viewingTask && <ViewTaskModal task={viewingTask} onClose={() => setViewingTask(null)} />}
                {taskToDelete && <DeleteConfirmationModal task={taskToDelete} onClose={() => setTaskToDelete(null)} onConfirm={handleDeleteTask} isDeleting={isDeleting} />}
                {showDeleteConfirmation && <DeleteConfirmationModal tasksToDelete={Array.from(selectedTasks)} onClose={() => setShowDeleteConfirmation(false)} onConfirm={handleDeleteTask} isDeleting={isDeleting} />}
            </div>
        </div>
    );
};

