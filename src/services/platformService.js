import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

/**
 * Platform verbs — what Odenta does to Odenta.
 *
 * Named after the act rather than the HTTP shape, like every other service
 * here: a founder *suspends a tenant*, *deactivates an account*, *records a
 * payment*. Screens import from this file and never from `@/api`, so pointing
 * the console at a different backend is a change to `api/client.js` and to
 * nothing else.
 *
 * Two conventions worth knowing before reading the rest:
 *
 * **Money is piastres.** Every `…Egp` field crossing this boundary is an
 * integer — EGP × 100. The server counts and the screen formats. A decimal here
 * would be a rounding error waiting for a quarterly report.
 *
 * **Destructive verbs take a reason.** Suspending a tenant, deactivating an
 * account and exporting the audit trail all require one, and the requirement is
 * enforced by the server rather than by the form. It is read months later, by
 * somebody else, trying to understand what happened.
 */

/* ---------------------------------------------------------------- board */

/**
 * The whole founders' board in one read.
 *
 * Deliberately one call rather than nine. The screen shows tenants, accounts,
 * revenue, throughput, security posture, fleet health, alerts and recent
 * operator activity, and nine endpoints would be nine round trips, nine caches
 * and — the part that actually bites — nine chances for the tenant count in a
 * tile to disagree with the tenant count in a chart legend.
 */
export const getOverview = (params) => api.get(endpoints.platform.overview, params);

/* -------------------------------------------------------------- tenants */

export const getTenants = (params) => api.get(endpoints.platform.tenants, params);
export const getTenant = (tenantId, params) => api.get(endpoints.platform.tenant(tenantId), params);

/** The plan catalogue, so the screen shows the prices the server bills. */
export const getPlans = () => api.get(endpoints.platform.plans);

/** Sign a university or a partner clinic. `tenantId` becomes a partition key. */
export const createTenant = (payload) => api.post(endpoints.platform.tenants, payload);

export const updateTenant = (tenantId, payload) =>
  api.patch(endpoints.platform.tenant(tenantId), payload);

/**
 * Move a tenant through its lifecycle.
 *
 * `reason` is required for anything that stops service, and `cascadeAccounts`
 * defaults to true — a tenant marked suspended whose users can still sign in is
 * a tenant that is not suspended. Resolves with `{ tenant, cascade }` so the
 * screen can say how many logins actually moved, including the ones that did
 * not.
 */
export const setTenantStatus = (tenantId, { status, reason, cascadeAccounts = true }) =>
  api.post(endpoints.platform.tenantStatus(tenantId), { status, reason, cascadeAccounts });

/* -------------------------------------------------------------- accounts */

/**
 * One page of every login on the platform.
 *
 * Searched and filtered on the server against an indexed prefix set, and paged
 * by continuation token rather than page number — so page forty costs what page
 * one costs. `continuation` comes back on the `X-Continuation` header; pass it
 * straight back to continue.
 */
export const getAccounts = (params) => api.get(endpoints.platform.accounts, params);

/** The tiles above the table. One point read on the server, flat forever. */
export const getAccountsSummary = () => api.get(endpoints.platform.accountsSummary);

export const getAccount = (userId) => api.get(endpoints.platform.account(userId));

/**
 * Create a login.
 *
 * No password is sent and none comes back. The account is created unusable and
 * flagged for reset, and the credential is issued out of band — an endpoint
 * that could set somebody else's password is an endpoint that can become them.
 */
export const createAccount = (payload) => api.post(endpoints.platform.accounts, payload);

/**
 * Activate or deactivate. Deactivating ends every session immediately rather
 * than at the next token expiry, which is what "deactivated" has to mean.
 */
export const setAccountStatus = (userId, { status, reason }) =>
  api.post(endpoints.platform.accountStatus(userId), { status, reason });

/** Clear a lockout the system applied after repeated failures. */
export const unlockAccount = (userId) => api.post(endpoints.platform.accountUnlock(userId), {});

/** Change what somebody is. Always revokes their sessions, in both directions. */
export const setAccountRole = (userId, { role, confirmSuperadmin = false }) =>
  api.post(endpoints.platform.accountRole(userId), { role, confirmSuperadmin });

/** Force a reset at next sign-in *and* revoke every session, together. */
export const forcePasswordReset = (userId) => api.post(endpoints.platform.accountReset(userId), {});

/**
 * Hand somebody a way in, again.
 *
 * Returns `{ account, credential }`, and the credential is the only copy that
 * will ever exist — the server stored an Argon2id hash of the password or a
 * keyed digest of the invitation and can never show it a second time. Hand it
 * straight to `CredentialModal`.
 */
export const issueCredential = (userId, mode = "invite") =>
  api.post(endpoints.platform.accountCredential(userId), { mode });

/**
 * Which roles have a seeded test account to sign in as.
 *
 * **404 is the expected production answer**, not a failure: the endpoint is not
 * mounted in a deployed build. Callers catch and fall back to preview-only
 * rather than showing an error for a capability that is absent by design.
 */
export const getDevSignInTargets = () => api.get(endpoints.platform.devSignInTargets);

/**
 * Take a real, writable session as that role's test account.
 *
 * Development only, and audited: the server writes a critical security event
 * naming the operator before it hands the session over. Returns the same shape
 * as a password sign-in, so `adoptSession` takes it unchanged.
 */
export const devSignInAs = (role, tenantId = null) =>
  api.post(endpoints.platform.devSignIn, { role, tenantId });

export const revokeSessions = (userId) => api.delete(endpoints.platform.accountSessions(userId));

export const setAccountMfa = (userId, required) =>
  api.post(endpoints.platform.accountMfa(userId), { required });

/**
 * Delete a login, permanently.
 *
 * `confirmEmail` must repeat the account's own address — the pattern a cloud
 * console uses for an irreversible destroy, because the mistake it prevents is
 * not misunderstanding the button, it is clicking the wrong row. What is
 * deleted is the login; everything the person did survives it.
 */
export const deleteAccount = (userId, { confirmEmail, reason }) =>
  api.delete(endpoints.platform.account(userId), { body: { confirmEmail, reason } });

/**
 * Import a cohort.
 *
 * Resolves with per-row outcomes rather than throwing on the first bad line, so
 * a four-hundred-row import with one duplicate creates 399 and names the one.
 */
export const bulkCreateAccounts = ({ tenantId, defaultRole, rows }) =>
  api.post(endpoints.platform.accountsBulk, { tenantId, defaultRole, rows });

/* ------------------------------------------------------------- analytics */

/**
 * System-wide insight, folded from per-tenant daily rollups.
 *
 * `range` is one of 7d / 30d / 90d / 180d / 365d, and every total comes back
 * with its movement against the equivalent window immediately before — a number
 * on an analytics screen without "against what" is decoration.
 */
export const getAnalytics = (params) => api.get(endpoints.platform.analytics, params);

/* -------------------------------------------------------------- activity */

/** The operator trail: what Odenta did, to whom, and when. */
export const getActivity = (params) => api.get(endpoints.platform.activity, params);

/**
 * Export the trail.
 *
 * Bounded to a quarter by the server, and itself audited — a bulk read of
 * personal data is the shape of an exfiltration whoever is doing it, so the
 * export writes a security event naming the range and the operator before it
 * returns a byte.
 */
export const exportActivity = ({ from, to, tenantId, reason }) =>
  api.post(endpoints.platform.activityExport, { from, to, tenantId, reason });

/* -------------------------------------------------------------- security */

export const getSecurityEvents = (params) => api.get(endpoints.platform.securityEvents, params);
export const getSecuritySummary = () => api.get(endpoints.platform.securitySummary);

/**
 * Acknowledge, resolve or dismiss an event.
 *
 * The status moves and nothing else does. An event is a record of something
 * that happened; editing its severity after the fact would make the feed an
 * opinion rather than a log.
 */
export const setSecurityEventStatus = (eventId, { status, note, month }) =>
  api.post(endpoints.platform.securityEventStatus(eventId), { status, note, month });

export const getAlerts = (params) => api.get(endpoints.platform.alerts, params);

export const acknowledgeAlert = (alertId, { resolve = false } = {}) =>
  api.post(endpoints.platform.alertAcknowledge(alertId), { resolve });

export const dismissAlert = (alertId) => api.delete(endpoints.platform.alert(alertId));

/* --------------------------------------------------------------- servers */

export const getServers = () => api.get(endpoints.platform.servers);

/** Load, latency, error rate and RU spend over 24h / 7d / 30d. */
export const getServerLoad = (params) => api.get(endpoints.platform.serverLoad, params);

/** Where the request units are going, by tenant — the Cosmos bill, itemised. */
export const getServerCost = (params) => api.get(endpoints.platform.serverCost, params);

/**
 * Cordon or drain a node.
 *
 * An intent the replica reads and acts on — a draining node fails readiness, so
 * the balancer stops sending it traffic. Refused by the server when it is the
 * last healthy node, because the failure mode is an operator diagnosing a slow
 * request by draining the fleet one node at a time.
 */
export const setServerState = (nodeId, { status, reason }) =>
  api.post(endpoints.platform.serverState(nodeId), { status, reason });

export const getCacheStats = () => api.get(endpoints.platform.cache);

/** Clears the in-process cache on the replica that serves this request only. */
export const flushCache = () => api.post(endpoints.platform.cacheFlush, {});

/* --------------------------------------------------------------- billing */

/**
 * Two different truths, returned together: `recurring` is what the contracts
 * say is due each month, `ledger` is what has actually been invoiced and
 * collected. They disagree constantly and a screen showing one would be lying
 * about whichever question was being asked.
 */
export const getBillingSummary = (params) => api.get(endpoints.platform.billingSummary, params);

export const getSubscription = (tenantId) => api.get(endpoints.platform.subscription(tenantId));
export const saveSubscription = (tenantId, payload) =>
  api.put(endpoints.platform.subscription(tenantId), payload);

export const getInvoices = (params) => api.get(endpoints.platform.invoices, params);
export const getInvoice = (invoiceId) => api.get(endpoints.platform.invoice(invoiceId));

/** The priced draft an operator reviews. Nothing is written until they issue. */
export const getInvoiceDraft = (tenantId, params) =>
  api.get(endpoints.platform.invoiceDraft(tenantId), params);

export const createInvoice = (payload) => api.post(endpoints.platform.invoices, payload);

export const setInvoiceStatus = (invoiceId, { status, reason }) =>
  api.post(endpoints.platform.invoiceStatus(invoiceId), { status, reason });

/**
 * Record money that has arrived.
 *
 * The payment and the invoice it settles are written atomically on the server —
 * a half-applied pair is a ledger that lies in one of two directions, and both
 * are worse than the write failing.
 */
export const recordPayment = (payload) => api.post(endpoints.platform.payments, payload);

export const getPayments = (params) => api.get(endpoints.platform.payments, params);

/* -------------------------------------------------------------- settings */

export const getSettings = () => api.get(endpoints.platform.settings);

export const setSetting = (key, value) => api.put(endpoints.platform.setting(key), { value });

/** Delete the override and fall back to the built-in value. */
export const resetSetting = (key) => api.delete(endpoints.platform.setting(key));

/* ----------------------------------------------------------------- roles */

/**
 * The role matrix: the ten built-in roles, any custom ones, and the catalogue.
 *
 * Built-in roles are code and cannot be edited — they are wired into
 * navigation, two route guards and two permission catalogues, and an editable
 * version would be a settings screen capable of locking everybody out.
 */
export const getRoles = () => api.get(endpoints.platform.roles);

/**
 * Save a custom role.
 *
 * A custom role always names a `basedOn` built-in and its permissions are
 * intersected with that role's grant on the server — so a custom role can only
 * ever *narrow*. Resolves with `ignored`, the permissions that were dropped,
 * so the screen can explain why a box it ticked did not stick.
 */
export const saveRole = (roleKey, payload) => api.put(endpoints.platform.role(roleKey), payload);

export const deleteRole = (roleKey) => api.delete(endpoints.platform.role(roleKey));

/* --------------------------------------------------------------- preview */

/** Which roles can be previewed for a tenant, and whether the identity exists. */
export const getPreviewTargets = (tenantId) =>
  api.get(endpoints.platform.previewTargets, { tenantId });

/**
 * Open a tenant's portal, read-only, as a named preview identity.
 *
 * Never as a real person: the session is minted for a permanently-visible
 * account called `preview.<role>@<tenant>.odenta.preview`, so no patient's
 * record is read through somebody's identity and no audit row can say a
 * tenant's own staff did something Odenta did.
 *
 * Resolves with a short-lived token and no refresh cookie, so a forgotten tab
 * stops working within the hour. Every mutating request on it is refused by the
 * server.
 */
export const openPreviewSession = ({ tenantId, role, reason }) =>
  api.post(endpoints.platform.previewSession, { tenantId, role, reason });
