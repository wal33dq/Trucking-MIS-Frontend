export enum Role {
  Admin = 'admin',
  Owner = 'owner',
  ProjectDivider = 'project_divider',
  SaleAgent = 'sale_agent',
  Dispatcher = 'dispatcher',
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  _id: string;
  mcNumber: string;
  companyName: string;
  address?: string;
  email?: string;
  phone?: string;
  workingDate?: string;
  saleAgent: string | User; // Can be populated with User object
  driverName?: string;
  truckType?: string;
  // FIX: Changed to 'documentUrls' to correctly handle multiple documents
  documentUrls?: string[]; 
  offerRate?: number;
  weight?: number;
  callTime?: string;
  comments?: string;
  dispatcher?: string | User; // Can be populated
  status?: 'assigned' | 'submitted' | 'invoiced';
  poNumber?: string;
  loadDetail?: string;
  pickupDate?: string;
  deliveryDate?: string;
  rate?: number;
  brokerDetail?: string;
  loadStatus?: string;
  invoiceAmount?: number;
  invoiceDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
