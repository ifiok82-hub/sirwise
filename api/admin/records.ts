import { getDatabase, type ApiRequest, type ApiResponse } from '../_store.js';

export default function handler(req: ApiRequest, res: ApiResponse) {
  const db = getDatabase();
  res.status(200).json({
    users: db.users,
    auditLogs: db.auditLogs,
    downloads: db.downloads,
  });
}
