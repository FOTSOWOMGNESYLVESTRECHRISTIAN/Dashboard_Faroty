import { Application } from "../services/applicationService";

export type ApplicationStatus = 'active' | 'inactive' | 'maintenance' | 'all';

export interface ApplicationColumn extends Application {
  status: ApplicationStatus;
  actions?: React.ReactNode;
}

export const statusOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actives' },
  { value: 'inactive', label: 'Inactives' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const platformOptions = [
  { value: 'all', label: 'Toutes' },
  { value: 'web', label: 'Web' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Bureau' },
];

export const typeOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'saas', label: 'SaaS' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'cms', label: 'CMS' },
  { value: 'api', label: 'API' },
];
