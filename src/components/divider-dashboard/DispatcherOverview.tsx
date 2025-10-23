import React from 'react';
import { Task, User, BookedLoad } from '../../types';
import { ChevronDownIcon } from './Icons';

interface DispatcherOverviewProps {
    dispatchers: User[];
    activeDispatcherId: string;
    setActiveDispatcherId: (id: string) => void;
    dispatcherTasks: Task[];
    dispatcherError: string;
    loadingDispatcherTasks: boolean;
    filteredDispatcherTasks: Task[];
    expandedRows: Set<string>;
    toggleExpanded: (taskId: string) => void;
    getStatusColor: (status: string) => string;
    getPaymentStatusColor: (status: string) => string;
}

export const DispatcherOverview = ({
    dispatchers,
    activeDispatcherId,
    setActiveDispatcherId,
    dispatcherTasks,
    dispatcherError,
    loadingDispatcherTasks,
    filteredDispatcherTasks,
    expandedRows,
    toggleExpanded,
    getStatusColor,
    getPaymentStatusColor,
}: DispatcherOverviewProps) => {
    return (
        <div>
            <div className="mb-4 flex space-x-2 border-b overflow-x-auto">
                <button onClick={() => setActiveDispatcherId('all')} className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${activeDispatcherId === 'all' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>All Dispatchers ({dispatcherTasks.length})</button>
                {dispatchers.map(dispatcher => (
                    <button key={dispatcher._id} onClick={() => setActiveDispatcherId(dispatcher._id)} className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${activeDispatcherId === dispatcher._id ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        {dispatcher.name} ({dispatcherTasks.filter(t => (t.dispatcher as User)?._id === dispatcher._id).length})
                    </button>
                ))}
            </div>
            {dispatcherError && <p className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{dispatcherError}</p>}
            {loadingDispatcherTasks ? <p className="text-center py-8">Loading...</p> : (
                 <div className="overflow-x-auto">
                 <table className="min-w-full border-separate border-spacing-y-4">
                   <thead className="bg-gray-50">
                     <tr>
                       {['Company', 'Sale Agent', 'Dispatcher', 'Status', 'Total Loads', 'Total Billed', ''].map(h => (
                         <th key={h} className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                       ))}
                     </tr>
                   </thead>
                   {filteredDispatcherTasks.length > 0 ? filteredDispatcherTasks.map(task => {
                       const totalBilled = task.bookedLoads?.reduce((sum: number, load: BookedLoad) => sum + load.invoiceAmount, 0) || 0;
                       const isExpanded = expandedRows.has(task._id);
                       return (
                        <tbody key={task._id} className="bg-white rounded-lg shadow-md">
                         <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpanded(task._id)}>
                           <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.companyName} <span className="text-gray-400">({task.mcNumber})</span></td>
                           <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{(task.saleAgent as User)?.name || 'N/A'}</td>
                           <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{(task.dispatcher as User)?.name || 'N/A'}</td>
                           <td className="py-4 px-4 whitespace-nowrap text-sm">
                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                                 task.status === 'invoiced' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                             }`}>{task.status}</span>
                           </td>
                           <td className="py-4 px-4 whitespace-nowrap text-sm text-center font-medium text-gray-700">{task.bookedLoads?.length || 0}</td>
                           <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-green-700">${totalBilled.toLocaleString()}</td>
                           <td className="py-4 px-4"><ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></td>
                         </tr>
                         {isExpanded && task.bookedLoads && task.bookedLoads.length > 0 && (
                            <tr className="bg-gray-50/50">
                                <td colSpan={7} className="p-4">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white rounded-lg shadow-inner border">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    {['PO #','Load Detail','Load Status','Payment Status','Invoice Amount','Pickup','Delivery'].map(h => (
                                                        <th key={h} className="border p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {task.bookedLoads.map((load: BookedLoad) => (
                                                    <tr key={load._id} className="hover:bg-gray-50">
                                                        <td className="border-b p-3 text-sm whitespace-nowrap">{load.poNumber}</td>
                                                        <td className="border-b p-3 text-sm whitespace-nowrap">{load.loadDetail}</td>
                                                        <td className="border-b p-3 text-sm whitespace-nowrap">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(load.loadStatus)}`}>{load.loadStatus}</span>
                                                        </td>
                                                        <td className="border-b p-3 text-sm whitespace-nowrap">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(load.paymentStatus || 'Pending')}`}>{load.paymentStatus || 'Pending'}</span>
                                                        </td>
                                                        <td className="border-b p-3 text-sm font-semibold text-green-700 whitespace-nowrap">${load.invoiceAmount.toLocaleString()}</td>
                                                        <td className="border-b p-3 text-sm whitespace-nowrap">{new Date(load.pickupDate).toLocaleDateString()}</td>
                                                        <td className="border-b p-3 text-sm whitespace-nowrap">{new Date(load.deliveryDate).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                       );
                     }) : (
                        <tbody>
                           <tr><td colSpan={7} className="text-center py-8 text-gray-500">No tasks found for this dispatcher.</td></tr>
                        </tbody>
                     )}
                 </table>
               </div>
            )}
        </div>
    );
};

