-- Seed canonical plan rows.
-- Uses ON CONFLICT (id) DO UPDATE so re-running is safe and re-applies limit/feature changes.

INSERT INTO plans (id, name, stripe_product_id, monthly_price_cents, annual_price_cents, limits, features, is_active, display_order)
VALUES
  (
    'free',
    'Free',
    '',
    0,
    0,
    '{"includedTokens":0,"includedCredits":200,"includedVoiceMinutes":0,"includedSandboxSeconds":0,"maxWorkflows":null,"maxVoiceAgents":0,"maxPhoneNumbers":0,"maxConnections":5,"maxKnowledgeBases":null,"maxMembers":null,"maxRunsPerDay":100,"maxWorkflowGenerationsPerPeriod":20,"maxFileUploadMb":5}'::jsonb,
    '{"customMcpServers":false,"codeNodes":false,"voiceAgents":false,"voiceToneConfig":false,"knowledgeBases":false,"skillsMarketplace":false,"workflowEditorV0":false,"auditLog":false,"sso":false,"prioritySupport":false,"videoSupport":false}'::jsonb,
    true,
    0
  ),
  (
    'starter',
    'Starter',
    '',
    4900,
    4000,
    '{"includedTokens":0,"includedCredits":10000,"includedVoiceMinutes":0,"includedSandboxSeconds":0,"maxWorkflows":null,"maxVoiceAgents":null,"maxPhoneNumbers":5,"maxConnections":null,"maxKnowledgeBases":null,"maxMembers":null,"maxRunsPerDay":100,"maxWorkflowGenerationsPerPeriod":30,"maxFileUploadMb":null}'::jsonb,
    '{"customMcpServers":false,"codeNodes":false,"voiceAgents":true,"voiceToneConfig":true,"knowledgeBases":true,"skillsMarketplace":false,"workflowEditorV0":true,"auditLog":false,"sso":false,"prioritySupport":false,"videoSupport":false}'::jsonb,
    true,
    1
  ),
  (
    'pro',
    'Pro',
    '',
    14900,
    12000,
    '{"includedTokens":0,"includedCredits":40000,"includedVoiceMinutes":0,"includedSandboxSeconds":0,"maxWorkflows":null,"maxVoiceAgents":null,"maxPhoneNumbers":20,"maxConnections":null,"maxKnowledgeBases":null,"maxMembers":null,"maxRunsPerDay":1000,"maxWorkflowGenerationsPerPeriod":null,"maxFileUploadMb":null}'::jsonb,
    '{"customMcpServers":true,"codeNodes":true,"voiceAgents":true,"voiceToneConfig":true,"knowledgeBases":true,"skillsMarketplace":false,"workflowEditorV0":true,"auditLog":true,"sso":true,"prioritySupport":true,"videoSupport":true}'::jsonb,
    true,
    2
  ),
  (
    'custom',
    'Custom',
    '',
    0,
    0,
    '{"includedTokens":null,"includedCredits":null,"includedVoiceMinutes":null,"includedSandboxSeconds":null,"maxWorkflows":null,"maxVoiceAgents":null,"maxPhoneNumbers":null,"maxConnections":null,"maxKnowledgeBases":null,"maxMembers":null,"maxRunsPerDay":null,"maxWorkflowGenerationsPerPeriod":null,"maxFileUploadMb":null}'::jsonb,
    '{"customMcpServers":true,"codeNodes":true,"voiceAgents":true,"voiceToneConfig":true,"knowledgeBases":true,"skillsMarketplace":true,"workflowEditorV0":true,"auditLog":true,"sso":true,"prioritySupport":true,"videoSupport":true}'::jsonb,
    true,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name                  = EXCLUDED.name,
  monthly_price_cents   = EXCLUDED.monthly_price_cents,
  annual_price_cents    = EXCLUDED.annual_price_cents,
  limits                = EXCLUDED.limits,
  features              = EXCLUDED.features,
  display_order         = EXCLUDED.display_order,
  updated_at            = now();
