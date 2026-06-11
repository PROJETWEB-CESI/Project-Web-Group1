// In-memory registry of open Server-Sent Events connections, used to push
// session updates (new/revoked sessions, forced logout) to connected
// clients in real time. Single-instance only: fine since iam-service runs
// as a single replica in this deployment.

const userClients = new Map(); // userId -> Set<res>
const sessionClients = new Map(); // sid -> Set<res>

function addClient(userId, sid, res) {
  if (!userClients.has(userId)) userClients.set(userId, new Set());
  userClients.get(userId).add(res);

  if (!sessionClients.has(sid)) sessionClients.set(sid, new Set());
  sessionClients.get(sid).add(res);
}

function removeClient(userId, sid, res) {
  userClients.get(userId)?.delete(res);
  if (userClients.get(userId)?.size === 0) userClients.delete(userId);

  sessionClients.get(sid)?.delete(res);
  if (sessionClients.get(sid)?.size === 0) sessionClients.delete(sid);
}

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function broadcastToUser(userId, event, data = {}) {
  const clients = userClients.get(userId);
  if (!clients) return;
  for (const res of clients) send(res, event, data);
}

function notifySessionRevoked(sid) {
  const clients = sessionClients.get(sid);
  if (!clients) return;
  for (const res of clients) send(res, 'session-revoked', { sid });
}

module.exports = { addClient, removeClient, broadcastToUser, notifySessionRevoked };
