/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");
const Database = require("better-sqlite3");
const { fileURLToPath } = require("node:url");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.startsWith("file:")) {
  throw new Error("DATABASE_URL debe apuntar a un archivo SQLite (file:...).");
}

const databasePath = fileURLToPath(databaseUrl);
const db = new Database(databasePath);

db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    process TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_company_role_key ON users(email, company, role);
  CREATE INDEX IF NOT EXISTS users_company_role_active_idx ON users(company, role, active);

  CREATE TABLE IF NOT EXISTS app_counters (
    key TEXT PRIMARY KEY NOT NULL,
    value INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS change_requests (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL,
    company TEXT NOT NULL,
    process TEXT NOT NULL,
    leaderUserId TEXT,
    leaderName TEXT NOT NULL,
    creatorUserId TEXT NOT NULL,
    creatorName TEXT NOT NULL,
    currentState TEXT NOT NULL DEFAULT 'BORRADOR',
    currentResponsibleRole TEXT NOT NULL,
    currentResponsibleId TEXT,
    currentResponsibleName TEXT,
    selectedApproverId TEXT,
    selectedApproverName TEXT,
    selectedApproverRole TEXT,
    changeTypes TEXT NOT NULL,
    analysis TEXT NOT NULL,
    implementationPlan TEXT NOT NULL,
    qualityValidation TEXT,
    correctionNotes TEXT,
    approvedAt DATETIME,
    followupStartedAt DATETIME,
    closeDueAt DATETIME,
    closedAt DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS change_requests_code_key ON change_requests(code);
  CREATE INDEX IF NOT EXISTS change_requests_company_idx ON change_requests(company);
  CREATE INDEX IF NOT EXISTS change_requests_process_idx ON change_requests(process);
  CREATE INDEX IF NOT EXISTS change_requests_creatorUserId_idx ON change_requests(creatorUserId);
  CREATE INDEX IF NOT EXISTS change_requests_leaderUserId_idx ON change_requests(leaderUserId);
  CREATE INDEX IF NOT EXISTS change_requests_currentState_idx ON change_requests(currentState);
  CREATE INDEX IF NOT EXISTS change_requests_responsible_idx ON change_requests(currentResponsibleRole, currentResponsibleId);

  CREATE TABLE IF NOT EXISTS change_approvals (
    id TEXT PRIMARY KEY NOT NULL,
    changeRequestId TEXT NOT NULL,
    approverUserId TEXT,
    approverName TEXT NOT NULL,
    approverRole TEXT NOT NULL,
    approved INTEGER NOT NULL,
    position TEXT,
    observations TEXT,
    signature TEXT,
    approvedAt DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT change_approvals_request_fkey FOREIGN KEY (changeRequestId)
      REFERENCES change_requests(id) ON DELETE CASCADE ON UPDATE CASCADE
  );
  CREATE INDEX IF NOT EXISTS change_approvals_request_idx ON change_approvals(changeRequestId);
  CREATE INDEX IF NOT EXISTS change_approvals_user_idx ON change_approvals(approverUserId);

  CREATE TABLE IF NOT EXISTS change_followups (
    id TEXT PRIMARY KEY NOT NULL,
    changeRequestId TEXT NOT NULL,
    responsibleUserId TEXT,
    responsibleName TEXT NOT NULL,
    effective INTEGER NOT NULL,
    observations TEXT,
    actions TEXT,
    position TEXT,
    followupAt DATETIME NOT NULL,
    closedAt DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT change_followups_request_fkey FOREIGN KEY (changeRequestId)
      REFERENCES change_requests(id) ON DELETE CASCADE ON UPDATE CASCADE
  );
  CREATE INDEX IF NOT EXISTS change_followups_request_idx ON change_followups(changeRequestId);
  CREATE INDEX IF NOT EXISTS change_followups_user_idx ON change_followups(responsibleUserId);

  CREATE TABLE IF NOT EXISTS change_history (
    id TEXT PRIMARY KEY NOT NULL,
    changeRequestId TEXT NOT NULL,
    fromState TEXT,
    toState TEXT NOT NULL,
    action TEXT NOT NULL,
    userId TEXT,
    userName TEXT NOT NULL,
    role TEXT,
    position TEXT,
    observation TEXT,
    selectedApproverId TEXT,
    selectedApproverName TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT change_history_request_fkey FOREIGN KEY (changeRequestId)
      REFERENCES change_requests(id) ON DELETE CASCADE ON UPDATE CASCADE
  );
  CREATE INDEX IF NOT EXISTS change_history_request_idx ON change_history(changeRequestId);
  CREATE INDEX IF NOT EXISTS change_history_created_idx ON change_history(createdAt);
`);

db.close();
console.log(`Estructura SQLite verificada en ${databasePath}`);
