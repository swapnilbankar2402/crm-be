export enum PermissionResource {
  // User Management
  USERS = 'users',
  ROLES = 'roles',
  TEAMS = 'teams',
  
  // CRM Core
  LEADS = 'leads',
  CONTACTS = 'contacts',
  COMPANIES = 'companies',
  DEALS = 'deals',
  
  // Activities
  TASKS = 'tasks',
  NOTES = 'notes',
  CALLS = 'calls',
  MEETINGS = 'meetings',
  EMAILS = 'emails',
  
  // Pipeline
  PIPELINES = 'pipelines',
  STAGES = 'stages',
  
  // Analytics & Reports
  ANALYTICS = 'analytics',
  REPORTS = 'reports',
  DASHBOARDS = 'dashboards',
  
  // Settings
  TENANT_SETTINGS = 'tenant-settings',
  INTEGRATIONS = 'integrations',
  CUSTOM_FIELDS = 'custom-fields',
  WEBHOOKS = 'webhooks',
  API_KEYS = 'api-keys',
  
  // Billing
  BILLING = 'billing',
  SUBSCRIPTIONS = 'subscriptions',
  INVOICES = 'invoices',
  
  // Files
  FILES = 'files',
  DOCUMENTS = 'documents',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Full access
  ASSIGN = 'assign',
  EXPORT = 'export',
  IMPORT = 'import',
}

export class Permission {
  static create(resource: PermissionResource, action: PermissionAction): string {
    return `${resource}:${action}`;
  }

  static createWildcard(resource: PermissionResource): string {
    return `${resource}:*`;
  }

  static superAdmin(): string {
    return '*';
  }

  static parse(permission: string): { resource: string; action: string } {
    const [resource, action] = permission.split(':');
    return { resource, action };
  }

  static matches(userPermission: string, requiredPermission: string): boolean {
    // Super admin has all permissions
    if (userPermission === '*') return true;

    // Exact match
    if (userPermission === requiredPermission) return true;

    // Wildcard match (e.g., "leads:*" matches "leads:read")
    const userParts = userPermission.split(':');
    const requiredParts = requiredPermission.split(':');

    if (userParts[0] === requiredParts[0] && userParts[1] === '*') {
      return true;
    }

    return false;
  }

  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.some((p) => Permission.matches(p, requiredPermission));
  }
}

// Predefined permission sets for common roles
export const PermissionSets = {
  SUPER_ADMIN: ['*'],
  
  ADMIN: [
    Permission.createWildcard(PermissionResource.USERS),
    Permission.createWildcard(PermissionResource.ROLES),
    Permission.createWildcard(PermissionResource.TEAMS),
    Permission.createWildcard(PermissionResource.LEADS),
    Permission.createWildcard(PermissionResource.CONTACTS),
    Permission.createWildcard(PermissionResource.COMPANIES),
    Permission.createWildcard(PermissionResource.DEALS),
    Permission.createWildcard(PermissionResource.TASKS),
    Permission.createWildcard(PermissionResource.NOTES),
    Permission.createWildcard(PermissionResource.ANALYTICS),
    Permission.create(PermissionResource.TENANT_SETTINGS, PermissionAction.MANAGE),
  ],
  
  MANAGER: [
    Permission.create(PermissionResource.USERS, PermissionAction.READ),
    Permission.createWildcard(PermissionResource.LEADS),
    Permission.createWildcard(PermissionResource.CONTACTS),
    Permission.createWildcard(PermissionResource.COMPANIES),
    Permission.createWildcard(PermissionResource.DEALS),
    Permission.createWildcard(PermissionResource.TASKS),
    Permission.createWildcard(PermissionResource.NOTES),
    Permission.create(PermissionResource.ANALYTICS, PermissionAction.READ),
    Permission.create(PermissionResource.REPORTS, PermissionAction.READ),
  ],
  
  SALES_REP: [
    Permission.create(PermissionResource.LEADS, PermissionAction.READ),
    Permission.create(PermissionResource.LEADS, PermissionAction.CREATE),
    Permission.create(PermissionResource.LEADS, PermissionAction.UPDATE),
    Permission.create(PermissionResource.CONTACTS, PermissionAction.READ),
    Permission.create(PermissionResource.CONTACTS, PermissionAction.CREATE),
    Permission.create(PermissionResource.CONTACTS, PermissionAction.UPDATE),
    Permission.create(PermissionResource.COMPANIES, PermissionAction.READ),
    Permission.createWildcard(PermissionResource.DEALS),
    Permission.createWildcard(PermissionResource.TASKS),
    Permission.createWildcard(PermissionResource.NOTES),
    Permission.createWildcard(PermissionResource.CALLS),
    Permission.createWildcard(PermissionResource.EMAILS),
  ],
  
  SUPPORT: [
    Permission.create(PermissionResource.LEADS, PermissionAction.READ),
    Permission.create(PermissionResource.CONTACTS, PermissionAction.READ),
    Permission.create(PermissionResource.CONTACTS, PermissionAction.UPDATE),
    Permission.create(PermissionResource.COMPANIES, PermissionAction.READ),
    Permission.create(PermissionResource.TASKS, PermissionAction.READ),
    Permission.create(PermissionResource.NOTES, PermissionAction.CREATE),
    Permission.create(PermissionResource.NOTES, PermissionAction.READ),
  ],
  
  VIEWER: [
    Permission.create(PermissionResource.LEADS, PermissionAction.READ),
    Permission.create(PermissionResource.CONTACTS, PermissionAction.READ),
    Permission.create(PermissionResource.COMPANIES, PermissionAction.READ),
    Permission.create(PermissionResource.DEALS, PermissionAction.READ),
    Permission.create(PermissionResource.ANALYTICS, PermissionAction.READ),
    Permission.create(PermissionResource.DASHBOARDS, PermissionAction.READ),
  ],
};