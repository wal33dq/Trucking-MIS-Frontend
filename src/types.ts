// src/types.ts
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

export interface BookedLoad {
  _id: string;
  poNumber: string;
  loadDetail: string;
  rate: number;
  loadStatus: string;
  paymentStatus: string;
  invoiceAmount: number;
  pickupDate: string;
  deliveryDate: string;
  brokerDetail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus = 'assigned' | 'submitted' | 'approved' | 'invoiced' | 'follow-up' | 'neglected' | 'draft';

export interface Task {
  _id: string;
  mcNumber: string | number;
  companyName: string;
  address?: string;
  email?: string;
  phone?: string;
  workingDate?: string;
  saleAgent?: string | User;
  driverName?: string;
  truckType?: string;
  documentUrls?: string[];
  offerRate?: number;
  weight?: number;
  callTime?: string;
  comments?: string;
  dispatcher?: string | User;
  status?: TaskStatus;
  createdAt?: string;
  updatedAt?: string;
  statusUpdateComment?: string;
  followUpDate?: string;
  bookedLoads?: BookedLoad[];

  // Deprecated properties that might still be in use
  poNumber?: string;
  loadDetail?: string;
  pickupDate?: string;
  deliveryDate?: string;
  rate?: number;
  brokerDetail?: string;
  loadStatus?: string;
  invoiceAmount?: number;
  invoiceDate?: string;
}

export interface Document {
    name: string;
    url: string;
}

// Represents a Task with populated data for UI display
export interface SubmittedTask extends Task {
    // Overriding dispatcher to be a User object, as it's expected to be populated for the UI
    dispatcher?: User;
    documents?: Document[];
}
