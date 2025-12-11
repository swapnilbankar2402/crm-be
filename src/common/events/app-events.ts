// src/common/events/app-events.ts

// --- Event Payloads ---

export class LeadAssignedEvent {
  leadId: string;
  assignedToUserId: string;
  assignedByUserId: string;
  tenantId: string;
}

export class TaskDueEvent {
  activityId: string;
  assignedToUserId: string;
  tenantId: string;
}

export class DealWonEvent {
  dealId: string;
  ownerId: string;
  tenantId: string;
}

// You can add more event payloads here as the app grows...

// --- Event Names (Constants) ---

export const AppEvents = {
  // Generic Audit Event
  AUDIT_LOG_EVENT: 'audit.log',

  // Specific Events (can also trigger audit logs)
  LEAD_ASSIGNED: 'lead.assigned',
  TASK_DUE_SOON: 'task.due_soon',
  DEAL_WON: 'deal.won',
};

// --- Generic Audit Event Payload ---
export class AuditEvent {
  tenantId: string;
  userId: string; // The user who performed the action
  action: string; // e.g., 'deal.create', 'user.update.status'
  entityType: string;
  entityId: string;
  details?: Record<string, any>; // For extra context
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
