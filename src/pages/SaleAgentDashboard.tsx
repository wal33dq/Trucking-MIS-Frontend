// src/SaleAgentDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Task, SubmittedTask, Document, TaskStatus } from '../types';
// Import NEW and UPDATED api functions
import { getMyTasksByStatus, getMyTaskCounts } from '../api';
import { SubmittedTaskDetailModal } from '../components/saleAgent-dashboard/SubmittedTaskDetailModal';
import { TaskSubmissionModal } from '../components/saleAgent-dashboard/TaskSubmissionModal';
import { NeglectFollowUpModal } from '../components/saleAgent-dashboard/NeglectFollowUpModal';
import { AddressModal } from '../components/saleAgent-dashboard/AddressModal';
import { EmailModal } from '../components/saleAgent-dashboard/EmailModal';
import { TaskTable } from '../components/saleAgent-dashboard/TaskTable';
// NEW: Import a simple pagination component
// Assuming SaleAgentDashboard.tsx is in 'src/pages/' and Pagination.tsx is in 'src/components/'
import { Pagination } from '../components/saleAgent-dashboard/Pagination'; 

const BACKEND_BASE_URL = 'https://icollectbackend.huburllc.com/';

export const SaleAgentDashboard = () => {
  // tasks state now only holds tasks for the CURRENTLY active tab and page
  const [tasks, setTasks] = useState<SubmittedTask[]>([]);
  // REMOVED: followUpTasks state is no longer needed
  
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'follow-up' | 'draft'>('current');
  
  // NEW: State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [tasksPerPage] = useState(25); // You can make this a dropdown later

  // NEW: State for tab counts
  const [taskCounts, setTaskCounts] = useState({
    current: 0,
    draft: 0,
    'follow-up': 0,
    history: 0,
  });
  
  const [selectedTaskForView, setSelectedTaskForView] = useState<SubmittedTask | null>(null);
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<Task | null>(null);
  const [selectedTaskForNeglect, setSelectedTaskForNeglect] = useState<Task | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const processTaskData = (data: SubmittedTask[]): SubmittedTask[] => {
    // This processing is fast and fine to keep on the client side
    return data.map((task) => {
        let documents: Document[] = [];
        if (task.documentUrls && Array.isArray(task.documentUrls)) {
            documents = task.documentUrls.map((urlPath: string) => {
                const filename = urlPath.split(/[\\/]/).pop() || 'Document';
                const fullUrl = `${BACKEND_BASE_URL}/${urlPath}`;
                return { name: filename, url: fullUrl };
            });
        }
        // Client-side sort for 'current' tab, as it's a small paginated list
        if (activeTab === 'current') {
            data.sort((a, b) => {
                const mcNumberA = a.mcNumber ? parseInt(String(a.mcNumber).replace(/\D/g, ''), 10) || 0 : 0;
                const mcNumberB = b.mcNumber ? parseInt(String(b.mcNumber).replace(/\D/g, ''), 10) || 0 : 0;
                return mcNumberA - mcNumberB;
            });
        }
        return { ...task, documents };
    });
  }

  // NEW: Function to fetch counts for all tabs
  const fetchCounts = useCallback(async () => {
    try {
      setLoadingCounts(true);
      const res = await getMyTaskCounts();
      setTaskCounts(res.data);
    } catch (err) {
      setError('Failed to fetch task counts.');
      console.error(err);
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  // NEW: Updated function to fetch only paginated tasks for the active tab
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    setError('');
    try {
      const res = await getMyTasksByStatus(activeTab, currentPage, tasksPerPage);
      setTasks(processTaskData(res.data.tasks));
      setTotalTasks(res.data.total);
    } catch (err) {
      setError('Failed to fetch assignments.');
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  }, [activeTab, currentPage, tasksPerPage]);

  // Fetch counts once on initial load
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Fetch tasks whenever the tab or page changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);


  // REMOVED: All local filtering logic (currentTasks, draftTasks, etc.)
  // The `tasks` state variable now holds the correct data directly from the API

  const handleSubmissionSuccess = () => {
      setSelectedTaskForSubmit(null);
      fetchTasks(); // Refresh current page
      fetchCounts(); // Refresh tab counts
  };
  
  const handleUpdateStatusSuccess = () => {
      setSelectedTaskForNeglect(null);
      fetchTasks(); // Refresh current page
      fetchCounts(); // Refresh tab counts
  };

  // NEW: Handler for changing tabs
  const handleTabClick = (tab: 'current' | 'history' | 'follow-up' | 'draft') => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  // NEW: Handler for changing pages
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loadingCounts) return <div className="text-center mt-12">Loading...</div>;
  if (error && !loadingTasks) return <div className="text-red-500 text-center mt-12 bg-red-100 p-4 rounded-md">{error}</div>;

  const renderContent = () => {
    if (loadingTasks) {
      return <div className="text-center py-12">Loading tasks...</div>;
    }
    
    // All tabs now just render the `tasks` state
    switch (activeTab) {
        case 'current':
            return <TaskTable tasks={tasks} tableType="current" onViewDetails={setSelectedTaskForView} onSubmitInfo={setSelectedTaskForSubmit} onNeglect={setSelectedTaskForNeglect} onViewEmail={setSelectedEmail} onViewAddress={setSelectedAddress} />;
        case 'draft':
            return <TaskTable tasks={tasks} tableType="draft" onViewDetails={setSelectedTaskForView} onSubmitInfo={setSelectedTaskForSubmit} onNeglect={setSelectedTaskForNeglect} onViewEmail={setSelectedEmail} onViewAddress={setSelectedAddress} />;
        case 'follow-up':
            return <TaskTable tasks={tasks} tableType="follow-up" onViewDetails={setSelectedTaskForView} onSubmitInfo={setSelectedTaskForSubmit} onNeglect={setSelectedTaskForNeglect} onViewEmail={setSelectedEmail} onViewAddress={setSelectedAddress} />;
        case 'history':
            return <TaskTable tasks={tasks} tableType="history" onViewDetails={setSelectedTaskForView} onSubmitInfo={setSelectedTaskForSubmit} onNeglect={setSelectedTaskForNeglect} onViewEmail={setSelectedEmail} onViewAddress={setSelectedAddress} />;
        default:
            return null;
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">My Assignments</h1>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => handleTabClick('current')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'current' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Current Tasks ({taskCounts.current})
          </button>
           <button onClick={() => handleTabClick('draft')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'draft' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Drafts ({taskCounts.draft})
          </button>
          <button onClick={() => handleTabClick('follow-up')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'follow-up' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Follow Up ({taskCounts['follow-up']})
          </button>
          <button onClick={() => handleTabClick('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            History ({taskCounts.history})
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-md mt-4 overflow-hidden">
        {renderContent()}
      </div>
      
      {/* NEW: Pagination Controls */}
      {!loadingTasks && totalTasks > 0 && (
        <Pagination
          currentPage={currentPage}
          totalCount={totalTasks}
          pageSize={tasksPerPage}
          onPageChange={handlePageChange}
        />
      )}
      
      {/* Render Modals */}
      {selectedTaskForView && <SubmittedTaskDetailModal task={selectedTaskForView} onClose={() => setSelectedTaskForView(null)} />}
      {selectedTaskForSubmit && <TaskSubmissionModal task={selectedTaskForSubmit} onClose={() => setSelectedTaskForSubmit(null)} onSuccess={handleSubmissionSuccess} />}
      {selectedTaskForNeglect && <NeglectFollowUpModal task={selectedTaskForNeglect} onClose={() => setSelectedTaskForNeglect(null)} onSuccess={handleUpdateStatusSuccess} />}
      {selectedAddress && <AddressModal address={selectedAddress} onClose={() => setSelectedAddress(null)} />}
      {selectedEmail && <EmailModal email={selectedEmail} onClose={() => setSelectedEmail(null)} />}

    </div>
  );
};

// REMOVED: The duplicate Pagination component code that was here is now gone.

