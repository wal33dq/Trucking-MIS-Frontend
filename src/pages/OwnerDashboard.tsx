import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp, Users, Truck, DollarSign, Filter, Search } from 'lucide-react';
import axios from 'axios';

// --- API SETUP ---
const api = axios.create({
  baseURL: 'https://icollectbackend.huburllc.com/', 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') ?? localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const getOwnerDashboardData = () => api.get('/tasks/owner/dashboard-data');
const findAllUsers = () => api.get('/users');


// --- TYPE DEFINITIONS ---
interface MonthlyRevenue {
    name: string;
    revenue: number;
}

interface SaleAgentStats {
    _id: string;
    name: string;
    submittedTasks: number;
    approvedTasks: number;
    totalRevenue: number;
}

interface CompanyLoad {
    companyName: string;
    totalLoads: number;
}

interface DispatcherStats {
    _id: string;
    name: string;
    assignedTasks: number;
    invoicedTasks: number;
    totalLoadAmount: number;
    totalLoadsBooked: number;
    loadsByCompany: CompanyLoad[];
}

interface OwnerDashboardData {
    totalRevenue: number;
    monthlyRevenueData: MonthlyRevenue[];
    saleAgentStats: SaleAgentStats[];
    dispatcherStats: DispatcherStats[];
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}


// --- HELPER COMPONENTS ---
const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    trend?: string; 
    trendDirection?: 'up' | 'down';
    className?: string;
}> = ({ title, value, icon, trend, trendDirection, className }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ${className}`}>
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                {trend && (
                    <div className={`flex items-center mt-2 text-sm ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`w-4 h-4 mr-1 ${trendDirection === 'down' ? 'rotate-180' : ''}`} />
                        <span>{trend}</span>
                    </div>
                )}
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
                {icon}
            </div>
        </div>
    </div>
);

const DetailCard: React.FC<{
    title: string;
    children: React.ReactNode;
    isExpanded?: boolean;
    onToggle?: () => void;
    expandable?: boolean;
}> = ({ title, children, isExpanded = true, onToggle, expandable = false }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div 
            className={`p-4 border-b border-gray-200 flex items-center justify-between ${expandable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
            onClick={expandable ? onToggle : undefined}
        >
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {expandable && (
                <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
            )}
        </div>
        {isExpanded && (
            <div className="p-4">
                {children}
            </div>
        )}
    </div>
);

const PerformanceTable: React.FC<{
    data: SaleAgentStats[];
    type: 'agents';
}> = ({ data, type }) => {
    const [sortField, setSortField] = useState<string>('totalRevenue');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');

    const sortedData = [...data]
        .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            const aVal = a[sortField as keyof SaleAgentStats];
            const bVal = b[sortField as keyof SaleAgentStats];
            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search agents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('name')}
                            >
                                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('submittedTasks')}
                            >
                                Submitted {sortField === 'submittedTasks' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('approvedTasks')}
                            >
                                Approved {sortField === 'approvedTasks' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('totalRevenue')}
                            >
                                Revenue {sortField === 'totalRevenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Approval Rate
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedData.map((agent) => {
                            const approvalRate = agent.submittedTasks > 0 ? (agent.approvedTasks / agent.submittedTasks * 100) : 0;
                            return (
                                <tr key={agent._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                {agent.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-gray-900">{agent.submittedTasks}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-green-600">{agent.approvedTasks}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-gray-900">
                                            ${agent.totalRevenue.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                                <div 
                                                    className={`h-2 rounded-full ${approvalRate >= 80 ? 'bg-green-500' : approvalRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(approvalRate, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{approvalRate.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DispatcherDetailView: React.FC<{ dispatchers: DispatcherStats[] }> = ({ dispatchers }) => {
    const [selectedDispatcher, setSelectedDispatcher] = useState<string | null>(null);
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                {dispatchers.map((dispatcher) => (
                    <div 
                        key={dispatcher._id} 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedDispatcher === dispatcher._id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedDispatcher(dispatcher._id)}
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{dispatcher.name}</h4>
                            <div className="flex space-x-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {dispatcher.totalLoadsBooked} loads
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    ${dispatcher.totalLoadAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Assigned:</span>
                                <span className="font-semibold ml-2">{dispatcher.assignedTasks}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Invoiced:</span>
                                <span className="font-semibold ml-2">{dispatcher.invoicedTasks}</span>
                            </div>
                        </div>
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${dispatcher.assignedTasks > 0 ? (dispatcher.invoicedTasks / dispatcher.assignedTasks * 100) : 0}%` 
                                    }}
                                ></div>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 block">
                                {((dispatcher.assignedTasks > 0 ? dispatcher.invoicedTasks / dispatcher.assignedTasks : 0) * 100).toFixed(1)}% completion rate
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {selectedDispatcher && (
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    {(() => {
                        const dispatcher = dispatchers.find(d => d._id === selectedDispatcher);
                        if (!dispatcher) return null;
                        
                        return (
                            <>
                                <h4 className="font-semibold text-lg text-gray-900 mb-4">
                                    {dispatcher.name} - Company Distribution
                                </h4>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={dispatcher.loadsByCompany.map(item => ({
                                                    name: item.companyName,
                                                    value: item.totalLoads
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                            >
                                                {dispatcher.loadsByCompany.map((_item, index) => (
                                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {dispatcher.loadsByCompany.map((company, index) => (
                                        <div key={company.companyName} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div 
                                                    className="w-3 h-3 rounded-full mr-2"
                                                    style={{ backgroundColor: colors[index % colors.length] }}
                                                ></div>
                                                <span className="text-sm text-gray-700">{company.companyName}</span>
                                            </div>
                                            <span className="text-sm font-semibold">{company.totalLoads} loads</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

const ModernUserTable: React.FC<{ users: User[] }> = ({ users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const roleColors: {[key: string]: string} = {
        sale_agent: 'bg-blue-100 text-blue-800',
        dispatcher: 'bg-green-100 text-green-800',
        admin: 'bg-purple-100 text-purple-800'
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="sale_agent">Sales Agents</option>
                        <option value="dispatcher">Dispatchers</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredUsers.map(user => (
                    <div key={user._id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{user.name}</h4>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                                {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---
export const OwnerDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardData, setDashboardData] = useState<OwnerDashboardData | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        monthly: true,
        agents: true,
        dispatchers: true
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log("Attempting to fetch dashboard data...");
                const dashboardResponse = await getOwnerDashboardData();
                console.log("✅ SUCCESS: API Response for Dashboard Data:", dashboardResponse);
                setDashboardData(dashboardResponse.data);

                console.log("Attempting to fetch user data...");
                const usersResponse = await findAllUsers();
                console.log("✅ SUCCESS: API Response for Users:", usersResponse);
                setUsers(usersResponse.data);

            } catch (err: any) {
                console.error("❌ ERROR: Failed to fetch dashboard data. This could be a network issue, a CORS problem, or a server error.", err);
                let errorMessage = "Failed to load dashboard. Please ensure the backend server is running and accessible.";
                if (err.response) {
                  console.error('Error data:', err.response.data);
                  console.error('Error status:', err.response.status);
                  errorMessage = `Error ${err.response.status}: ${err.response.data.message || 'Could not retrieve data from server.'}`;
                } else if (err.request) {
                  console.error('No response received:', err.request);
                   errorMessage = "No response from server. Is it running and have you enabled CORS?";
                } else {
                  console.error('Error message:', err.message);
                   errorMessage = `An unexpected error occurred: ${err.message}`;
                }
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            <span className="font-medium">{entry.name}:</span> {
                                entry.name === 'Revenue' || entry.name.includes('$') 
                                    ? `$${entry.value.toLocaleString()}` 
                                    : entry.value.toLocaleString()
                            }
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };
    
    if (loading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-lg font-semibold text-gray-700">Loading Dashboard...</p>
            </div>
        );
    }

    if (error) {
         return (
            <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md max-w-lg">
                    <h3 className="font-bold text-xl mb-2">Dashboard Error</h3>
                    <p>{error}</p>
                    <p className="mt-4 text-sm">Please check the browser's developer console for more technical details.</p>
                </div>
            </div>
        );
    }

    const renderOverview = () => (
        <div className="space-y-6">
            <DetailCard
                title="Monthly Revenue Trend"
                isExpanded={expandedSections.monthly}
                onToggle={() => toggleSection('monthly')}
                expandable={true}
            >
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={dashboardData?.monthlyRevenueData || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="revenue" 
                                fill="url(#colorGradient)" 
                                name="Revenue" 
                                radius={[4, 4, 0, 0]}
                            />
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#1e40af" stopOpacity={0.8}/>
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </DetailCard>
        </div>
    );

    const renderSaleAgents = () => (
        <DetailCard title="Sales Agent Performance Analysis">
            <PerformanceTable data={dashboardData?.saleAgentStats || []} type="agents" />
        </DetailCard>
    );

    const renderDispatchers = () => (
        <DetailCard title="Dispatcher Performance & Load Distribution">
            <DispatcherDetailView dispatchers={dashboardData?.dispatcherStats || []} />
        </DetailCard>
    );

    const renderUsers = () => (
        <DetailCard title="User Management">
            <ModernUserTable users={users} />
        </DetailCard>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Owner's Dashboard</h1>
                <p className="text-gray-600 mt-2">Monitor your business performance and team productivity</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Total Revenue" 
                    value={`$${dashboardData?.totalRevenue?.toLocaleString() || '0'}`}
                    icon={<DollarSign className="w-6 h-6 text-green-600" />}
                    trend="+12.5% from last month"
                    trendDirection="up"
                />
                <StatCard 
                    title="Sales Agents" 
                    value={`${dashboardData?.saleAgentStats?.length || 0}`}
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                />
                <StatCard 
                    title="Dispatchers" 
                    value={`${dashboardData?.dispatcherStats?.length || 0}`}
                    icon={<Truck className="w-6 h-6 text-purple-600" />}
                />
                <StatCard 
                    title="Total Users" 
                    value={`${users?.length || 0}`}
                    icon={<Users className="w-6 h-6 text-indigo-600" />}
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-1">
                <nav className="flex space-x-1">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'saleAgents', label: 'Sales Agents', icon: Users },
                        { id: 'dispatchers', label: 'Dispatchers', icon: Truck },
                        { id: 'users', label: 'Users', icon: Users }
                    ].map(({ id, label, icon: Icon }) => (
                        <button 
                            key={id}
                            onClick={() => setActiveTab(id)} 
                            className={`flex items-center space-x-2 py-2.5 px-4 font-medium rounded-lg transition-all duration-200 ${
                                activeTab === id 
                                    ? 'bg-blue-500 text-white shadow-sm' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="transition-all duration-300">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'saleAgents' && renderSaleAgents()}
                {activeTab === 'dispatchers' && renderDispatchers()}
                {activeTab === 'users' && renderUsers()}
            </div>
        </div>
    );
};

