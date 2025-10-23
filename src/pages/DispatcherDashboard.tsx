import React, { useState, useEffect } from 'react';
import { Task, BookedLoad } from '../types';
import { getDispatcherTasks, bookLoadForTask, updateLoadStatus, updateLoadPaymentStatus } from '../api'; 

const BACKEND_URL = 'https://icollectbackend.huburllc.com/';

// Icon components
const PrinterIcon = () => <span className="text-lg">🖨️</span>;
const FileTextIcon = () => <span className="text-lg">📄</span>;
const EyeIcon = () => <span className="text-lg">👁️</span>;
const TruckIcon = () => <span className="text-lg">🚛</span>;
const PlusIcon = () => <span className="text-lg">➕</span>;
const BookIcon = () => <span className="text-lg">📚</span>;

// Helper to get sale agent name
const getSaleAgentName = (saleAgent: string | { name?: string } | undefined): string => {
  if (!saleAgent) return 'N/A';
  if (typeof saleAgent === 'string') return saleAgent;
  return saleAgent.name || 'N/A';
};

// --- Multi-Load Invoice Print Component ---
const PrintMultiLoadInvoice = ({ task, loads, onClose }: { task: Task, loads: BookedLoad[], onClose: () => void }) => {
  // The total rate from all loads which will be used as the subtotal.
  const totalRate = loads.reduce((sum, load) => sum + (load.rate || 0), 0);
  
  // Use the offerRate from the task as the percentage.
  const flatPercentage = task.offerRate || 0;
  
  // The final fee is the percentage of the total rate.
  const totalFee = totalRate * (flatPercentage / 100);

  useEffect(() => {
    // Delay print dialog to allow content to render
    setTimeout(() => window.print(), 500);
  }, []);

  return (
    <>
      <style>
        {`
          @media print {
            body, html {
                height: 100%;
                overflow: hidden;
            }
            .printable-area {
                width: 100%;
                height: 100%;
                position: absolute;
                left: 0;
                top: 0;
            }
            .no-print {
                display: none;
            }
          }
        `}
      </style>
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto printable-area">
        <div className="max-w-4xl mx-auto p-8">
          {/* This section with buttons will be hidden during printing by the style above */}
          <div className="flex justify-between items-center mb-6 no-print">
            <h2 className="text-2xl font-bold text-gray-800">Invoice Print Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={window.print}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <PrinterIcon /> Print
              </button>
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
          
          {/* This is the div that will be printed */}
          <div className="bg-white border border-gray-200 p-8" id="invoice-content">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">The One Services & Solutions</h1>
              <p className="text-gray-600">{task.mcNumber} | {task.email} | {task.phone}</p>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">Bill to:</h3>
                <p className="text-gray-700 font-bold">{task.companyName}</p>
                <p className="text-gray-700">Driver: {task.driverName || 'N/A'}</p>
                <p className="text-gray-700">Email: {task.email || 'N/A'}</p>
                <p className="text-gray-700">Mobile No: {task.phone || 'N/A'}</p>

                <p className="text-gray-700">MC #: {task.mcNumber}</p>
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-bold mb-2">INVOICE</h3>
                <p className="text-gray-700"><strong>Invoice #:</strong> {Date.now().toString().slice(-6)}</p>
                <p className="text-gray-700"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                <p className="text-gray-700"><strong>Payment term:</strong>ZELLE</p>
                <p className="text-gray-700"><strong>Account #:</strong>khurram@theonellc.com</p>
                <p className="text-gray-700"><strong>Account Name:</strong>The One Services & Solutions</p>


              </div>
            </div>
            <table className="w-full border-collapse border border-gray-300 mb-8">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Trip Details</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Rate $</th>
                </tr>
              </thead>
              <tbody>
                {loads.map((load) => (
                  <tr key={load._id}>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>PO# {load.poNumber}</strong>: {load.loadDetail}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-medium">${(load.rate || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border-r border-gray-300 px-4 py-2 text-right font-bold">Subtotal</td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-bold">${totalRate.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="border-r border-gray-300 px-4 py-2 text-right font-bold"><strong>Dispatch Fee</strong></td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-bold">{flatPercentage}%</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="border-r border-gray-300 px-4 py-2 text-right font-bold text-xl">Total Amount Due</td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-bold text-xl">${totalFee.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="text-center text-gray-700 mt-8">
              <p className="text-lg font-semibold">Thank you for Choosing TOSS!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


// --- Book Load Modal Component ---
const BookLoadModal = ({ task, onClose, onLoadBooked }: { 
  task: Task, 
  onClose: () => void, 
  onLoadBooked: (taskId: string, newLoad: Omit<BookedLoad, '_id' | 'createdAt' | 'updatedAt'>) => void 
}) => {
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // JS months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    poNumber: '', 
    loadDetail: '', 
    pickupDate: getTodayDateString(), // Set default to current date
    deliveryDate: '',
    rate: '', 
    brokerDetail: '',
    loadStatus: 'Scheduled',
    paymentStatus: 'Pending', // --- NEW FIELD ---
    invoiceAmount: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newFormData = { ...prev, [name]: value };
        if (name === 'rate') {
            const rate = parseFloat(value);
            const offerRate = task.offerRate || 0;
            if (!isNaN(rate)) {
                // *** FIX: Calculate invoice amount as a percentage of the rate ***
                const invoiceAmount = rate * (offerRate / 100);
                newFormData.invoiceAmount = invoiceAmount.toFixed(2);
            } else {
                newFormData.invoiceAmount = '';
            }
        }
        return newFormData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const newLoadPayload = {
        ...formData,
        rate: parseFloat(formData.rate),
        invoiceAmount: parseFloat(formData.invoiceAmount),
      };
      await onLoadBooked(task._id, newLoadPayload);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to book load. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Book Load for {task.companyName}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="poNumber" placeholder="PO Number" value={formData.poNumber} onChange={handleChange} className="p-3 border rounded-lg" required />
            <input name="rate" placeholder="Rate" type="number" step="0.01" value={formData.rate} onChange={handleChange} className="p-3 border rounded-lg" required />
            <input name="invoiceAmount" placeholder="Invoice Amount" type="number" step="0.01" value={formData.invoiceAmount} onChange={handleChange} className="p-3 border rounded-lg" required readOnly />
            <select name="loadStatus" value={formData.loadStatus} onChange={handleChange} className="p-3 border rounded-lg" required>
              <option value="Scheduled">Scheduled</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            {/* --- NEW PAYMENT STATUS SELECTOR --- */}
            <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="p-3 border rounded-lg" required>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Overdue">Overdue</option>
            </select>
            <div className="md:col-span-2"><input name="loadDetail" placeholder="Load Detail (e.g., City, ST to City, ST)" value={formData.loadDetail} onChange={handleChange} className="w-full p-3 border rounded-lg" required /></div>
            <div className="md:col-span-2"><input name="brokerDetail" placeholder="Broker Detail" value={formData.brokerDetail} onChange={handleChange} className="w-full p-3 border rounded-lg" /></div>
            <div><label className="text-sm font-medium">Pickup Date</label><input name="pickupDate" type="date" value={formData.pickupDate} onChange={handleChange} className="w-full p-3 border rounded-lg" required /></div>
            <div><label className="text-sm font-medium">Delivery Date</label><input name="deliveryDate" type="date" value={formData.deliveryDate} onChange={handleChange} className="w-full p-3 border rounded-lg" required /></div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400" disabled={submitting}>{submitting ? 'Booking...' : 'Book Load'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Company Loads Detail Modal ---
const CompanyLoadsModal = ({ task, onClose, onAddLoad, onGenerateInvoice, onStatusChange, onPaymentStatusChange }: { 
  task: Task, 
  onClose: () => void,
  onAddLoad: () => void,
  onGenerateInvoice: (loadsToPrint: BookedLoad[]) => void,
  onStatusChange: (loadId: string, newStatus: string) => void,
  onPaymentStatusChange: (loadId: string, newStatus: string) => void
}) => {
  const loads = task.bookedLoads || [];
  const [selectedLoads, setSelectedLoads] = useState<string[]>([]);

  const handleSelectLoad = (loadId: string) => {
    setSelectedLoads((prev: string[]) => prev.includes(loadId) ? prev.filter((id: string) => id !== loadId) : [...prev, loadId]);
  };

  const handleSelectAll = () => {
    if (selectedLoads.length === loads.length) {
      setSelectedLoads([]);
    } else {
      setSelectedLoads(loads.map(l => l._id));
    }
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
  
  // --- NEW: Helper for payment status colors ---
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
        case 'Paid': return 'bg-green-100 text-green-800';
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        case 'Partial': return 'bg-blue-100 text-blue-800';
        case 'Overdue': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{task.companyName} - Booked Loads</h2>
            <p className="text-gray-600">MC Number: {task.mcNumber}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onAddLoad} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"><PlusIcon /> Add New Load</button>
            <button
              onClick={() => {
                const loadsToPrint = loads.filter(l => selectedLoads.includes(l._id));
                onGenerateInvoice(loadsToPrint);
              }}
              disabled={selectedLoads.length === 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileTextIcon /> Generate Invoice ({selectedLoads.length})
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light">&times;</button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {loads.length === 0 ? (
            <div className="text-center py-12"><TruckIcon /><p className="text-gray-500 text-lg mt-4">No loads booked yet</p></div>
          ) : (
            <table className="w-full border-collapse border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-center"><input type="checkbox" onChange={handleSelectAll} checked={selectedLoads.length === loads.length && loads.length > 0} /></th>
                  {['PO #', 'Load Detail', 'Load Status', 'Payment Status', 'Invoice Amount', 'Pickup', 'Delivery'].map(h => <th key={h} className="border p-2 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loads.map(load => (
                  <tr key={load._id} className="hover:bg-gray-50">
                    <td className="border p-2 text-center"><input type="checkbox" checked={selectedLoads.includes(load._id)} onChange={() => handleSelectLoad(load._id)} /></td>
                    <td className="border p-2">{load.poNumber}</td>
                    <td className="border p-2">{load.loadDetail}</td>
                    <td className="border p-2">
                      <select 
                        value={load.loadStatus} 
                        onChange={(e) => onStatusChange(load._id, e.target.value)}
                        className={`w-full p-1.5 text-xs font-semibold rounded-md border-0 focus:ring-2 focus:ring-indigo-500 ${getStatusColor(load.loadStatus)}`}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    {/* --- NEW PAYMENT STATUS SELECTOR --- */}
                    <td className="border p-2">
                      <select 
                        value={load.paymentStatus || 'Pending'} 
                        onChange={(e) => onPaymentStatusChange(load._id, e.target.value)}
                        className={`w-full p-1.5 text-xs font-semibold rounded-md border-0 focus:ring-2 focus:ring-indigo-500 ${getPaymentStatusColor(load.paymentStatus || 'Pending')}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Partial">Partial</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="border p-2 font-bold text-green-600">${load.invoiceAmount.toLocaleString()}</td>
                    <td className="border p-2">{new Date(load.pickupDate).toLocaleDateString()}</td>
                    <td className="border p-2">{new Date(load.deliveryDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex justify-end mt-8 border-t pt-4">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};

// --- Task Detail Modal ---
const TaskDetailModal = ({ task, onClose }: { task: Task, onClose: () => void }) => {
  if (!task) return null;

  const renderDetail = (label: string, value: any, format?: (val: any) => React.ReactNode) => {
    const content = value ? (format ? format(value) : value) : <span className="text-gray-400">N/A</span>;
    return (
      <div className="mb-3">
        <p className="font-semibold text-gray-800 text-sm">{label}:</p>
        <p className="text-gray-700">{content}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Task Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light">&times;</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
          {renderDetail("MC Number", task.mcNumber)}
          {renderDetail("Company Name", task.companyName)}
          {renderDetail("Driver Name", task.driverName)}
          {renderDetail("Email", task.email)}
          {renderDetail("Phone", task.phone)}
          {renderDetail("Offer Rate", task.offerRate, val => `${val}%`)}
          {renderDetail("Truck Type", task.truckType)}
          {renderDetail("Weight", task.weight, val => `${val} lbs`)}
          {renderDetail("Call Time", task.callTime)}
          {renderDetail("Status", task.status, val => <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{val}</span>)}
          {renderDetail("Working Date", task.workingDate, val => val ? new Date(val).toLocaleDateString() : 'N/A')}
          {renderDetail("Created", task.createdAt, val => val ? new Date(val).toLocaleString() : 'N/A')}
          {renderDetail("Last Updated", task.updatedAt, val => val ? new Date(val).toLocaleString() : 'N/A')}
          {renderDetail("Sale Agent", getSaleAgentName(task.saleAgent))}
          <div className="md:col-span-2">{renderDetail("Address", task.address)}</div>
          <div className="md:col-span-2">{renderDetail("Comments", task.comments)}</div>
          <div className="md:col-span-2">
            <p className="font-semibold text-gray-800 mb-2">Documents:</p>
            {task.documentUrls && task.documentUrls.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.documentUrls.map((url, index) => {
                  const filename = url.split(/[\\/]/).pop();
                  const fullUrl = `${BACKEND_URL}/${url.replace(/\\/g, '/')}`;
                  return (
                    <a key={index} href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 border">
                      <FileTextIcon />
                      <span className="text-blue-600 hover:underline text-sm">{filename || `Document ${index + 1}`}</span>
                    </a>
                  );
                })}
              </div>
            ) : <p className="text-gray-500">No documents attached.</p>}
          </div>
        </div>
        <div className="flex justify-end mt-8 border-t pt-4">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};


// --- Main Dashboard Component ---
export const DispatcherDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTaskForBooking, setSelectedTaskForBooking] = useState<Task | null>(null);
  const [viewingCompanyLoads, setViewingCompanyLoads] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<{ task: Task, loads: BookedLoad[] } | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getDispatcherTasks();
      setTasks(response.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleLoadBooked = async (taskId: string, newLoad: Omit<BookedLoad, '_id' | 'createdAt' | 'updatedAt'>) => {
    await bookLoadForTask(taskId, newLoad);
    fetchTasks();
  };

  const handleStatusChange = async (loadId: string, status: string) => {
    const updatedTasks = tasks.map((task: Task) => {
      if (task.bookedLoads && task.bookedLoads.some((load: BookedLoad) => load._id === loadId)) {
        return {
          ...task,
          bookedLoads: task.bookedLoads.map((load: BookedLoad) =>
            load._id === loadId ? { ...load, loadStatus: status } : load
          ),
        };
      }
      return task;
    });

    setTasks(updatedTasks);

    const taskToUpdateInModal = updatedTasks.find((t: Task) => t._id === viewingCompanyLoads?._id);

    if (taskToUpdateInModal) {
      setViewingCompanyLoads(taskToUpdateInModal);
    }

    try {
      await updateLoadStatus(loadId, { status });
    } catch (err) {
      console.error("Failed to update load status:", err);
      setError('Failed to update status. Please refresh and try again.');
      fetchTasks();
    }
  };

  // --- NEW: Handler for payment status change ---
  const handlePaymentStatusChange = async (loadId: string, paymentStatus: string) => {
    const updatedTasks = tasks.map((task: Task) => {
      if (task.bookedLoads && task.bookedLoads.some((load: BookedLoad) => load._id === loadId)) {
        return {
          ...task,
          bookedLoads: task.bookedLoads.map((load: BookedLoad) =>
            load._id === loadId ? { ...load, paymentStatus: paymentStatus } : load
          ),
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    const taskToUpdateInModal = updatedTasks.find((t: Task) => t._id === viewingCompanyLoads?._id);
    if (taskToUpdateInModal) {
      setViewingCompanyLoads(taskToUpdateInModal);
    }

    try {
      await updateLoadPaymentStatus(loadId, { paymentStatus });
    } catch (err) {
      console.error("Failed to update load payment status:", err);
      setError('Failed to update payment status. Please refresh and try again.');
      fetchTasks();
    }
  };


  const pendingTasks = tasks.filter((task: Task) => task.status === 'approved' && (!task.bookedLoads || task.bookedLoads.length === 0));
  const bookedTasks = tasks.filter((task: Task) => task.bookedLoads && task.bookedLoads.length > 0);
  
  const renderTable = (data: Task[]) => {
    if (data.length === 0) {
      return <div className="bg-white rounded-lg shadow p-12 text-center"><TruckIcon /><p className="text-gray-500 mt-4">No companies available in this tab.</p></div>;
    }
    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>{['Company', 'Contact', 'Offer Rate', 'Booked Loads', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {data.map((task) => (
              <tr key={task._id} className="hover:bg-gray-50">
                <td className="px-6 py-4"><div className="font-medium">{task.companyName}</div><div className="text-sm text-gray-500">MC: {task.mcNumber}</div></td>
                <td className="px-6 py-4"><div className="font-medium">{task.phone}</div><div className="text-sm text-gray-500">{task.email}</div></td>
                <td className="px-6 py-4 text-green-600 font-bold">{task.offerRate ? `${task.offerRate}%` : 'N/A'}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{task.bookedLoads?.length || 0} Loads</span></td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setViewingTask(task)} className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm flex items-center gap-1"><EyeIcon /> View</button>
                    <button onClick={() => setViewingCompanyLoads(task)} className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 text-sm flex items-center gap-1"><BookIcon /> Manage Loads</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) return <div className="text-center p-12">Loading...</div>;
  if (error) return <div className="text-center p-12 text-red-500">Error: {error}</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dispatcher Dashboard</h1>
        <div className="border-b mb-8">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('pending')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Available Companies ({pendingTasks.length})</button>
            <button onClick={() => setActiveTab('booked')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'booked' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Companies with Booked Loads ({bookedTasks.length})</button>
          </nav>
        </div>
        
        {activeTab === 'pending' ? renderTable(pendingTasks) : renderTable(bookedTasks)}
        
        {/* --- Modals --- */}
        {viewingTask && <TaskDetailModal task={viewingTask} onClose={() => setViewingTask(null)} />}
        {selectedTaskForBooking && <BookLoadModal task={selectedTaskForBooking} onClose={() => setSelectedTaskForBooking(null)} onLoadBooked={handleLoadBooked} />}
        {viewingCompanyLoads && <CompanyLoadsModal 
            task={viewingCompanyLoads} 
            onClose={() => setViewingCompanyLoads(null)} 
            onAddLoad={() => {
              setSelectedTaskForBooking(viewingCompanyLoads);
              setViewingCompanyLoads(null);
            }} 
            onGenerateInvoice={(loads) => setPrintingInvoice({ task: viewingCompanyLoads, loads })}
            onStatusChange={handleStatusChange}
            onPaymentStatusChange={handlePaymentStatusChange}
        />}
        {printingInvoice && <PrintMultiLoadInvoice task={printingInvoice.task} loads={printingInvoice.loads} onClose={() => setPrintingInvoice(null)} />}
      </div>
    </div>
  );
};

