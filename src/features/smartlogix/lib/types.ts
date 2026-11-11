export type ModuleId =
  | 'dashboard'
  | 'orders'
  | 'inventory'
  | 'shipments'
  | 'suppliers'
  | 'automation'
  | 'ai'
  | 'reports'

export type IntegrationState = 'configured_working' | 'configured_error' | 'not_configured' | 'disabled'

export type IntegrationStatus = {
  key: string
  label: string
  state: IntegrationState
  configured: boolean
  working: boolean
  message: string
  capabilities: string[]
  lastCheckedAt?: string | null
  lastError?: string | null
}

export type WorkflowRunStatus = 'queued' | 'running' | 'success' | 'error' | 'awaiting_approval' | 'disabled'

export type WorkflowDefinition = {
  key: string
  name: string
  category: 'orders' | 'inventory' | 'suppliers' | 'shipments' | 'ai'
  description: string
  integrations: string[]
  status: WorkflowRunStatus
  approvalsRequired: boolean
}

export type ModuleDefinition = {
  id: ModuleId
  label: string
  summary: string
  status: 'foundation' | 'planned'
}