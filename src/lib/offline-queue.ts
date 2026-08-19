/**
 * File d'attente offline — stocke les requêtes en IndexedDB (via idb)
 * pour synchronisation dès le retour du réseau.
 */
import { openDB, type IDBPDatabase } from "idb";

type QueuedRequest = {
  id?: number;
  path: string;
  method: string;
  body?: unknown;
  idempotencyKey?: string;
  createdAt: number;
  retryCount: number;
};

const DB_NAME = "fisclens-offline";
const STORE = "queue";
const DB_VERSION = 1;

let _db: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    },
  });
  return _db;
}

export const offlineQueue = {
  async enqueue(req: Omit<QueuedRequest, "id" | "createdAt" | "retryCount">): Promise<void> {
    const db = await getDb();
    await db.add(STORE, { ...req, createdAt: Date.now(), retryCount: 0 });
  },

  async getAll(): Promise<QueuedRequest[]> {
    const db = await getDb();
    return db.getAll(STORE);
  },

  async remove(id: number): Promise<void> {
    const db = await getDb();
    await db.delete(STORE, id);
  },

  async count(): Promise<number> {
    const db = await getDb();
    return db.count(STORE);
  },
};

// ---------------------------------------------------------------------------
// Synchronisation automatique au retour du réseau
// ---------------------------------------------------------------------------

if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    const { apiRequest } = await import("@/lib/api-client");
    const pending = await offlineQueue.getAll();

    for (const req of pending) {
      try {
        await apiRequest(req.path, {
          method: req.method as "POST" | "PATCH",
          body: req.body as any,
          idempotencyKey: req.idempotencyKey,
        });
        if (req.id !== undefined) await offlineQueue.remove(req.id);
      } catch {
        // Laisse en file pour la prochaine tentative
      }
    }
  });
}
