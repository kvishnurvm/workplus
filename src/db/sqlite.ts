import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;

const IDB_NAME = 'WorkPulseMaster_DB';
const IDB_STORE = 'sqlite_blobs';
const IDB_KEY = 'workpulse.sqlite';

/**
 * Open IndexedDB for SQLite persistence
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains(IDB_STORE)) {
        idb.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load SQLite binary from IndexedDB
 */
async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load SQLite from IndexedDB, fallback to fresh DB:', err);
    return null;
  }
}

/**
 * Save SQLite binary to IndexedDB
 */
async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(data, IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save SQLite to IndexedDB:', err);
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    if (dbInstance) {
      try {
        const binary = dbInstance.export();
        await saveToIndexedDB(binary);
      } catch (err) {
        console.error('Error exporting SQLite database:', err);
      }
    }
  }, 300);
}

let initPromise: Promise<Database> | null = null;

/**
 * Initialize SQLite WebAssembly & Database
 */
export async function initDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!SQL) {
        SQL = await initSqlJs({
          locateFile: (file) => `/${file}`,
        });
      }

      const existingData = await loadFromIndexedDB();
      if (existingData && existingData.length > 0) {
        try {
          dbInstance = new SQL.Database(existingData);
        } catch (dbErr) {
          console.warn('Failed to parse cached SQLite file, re-creating database:', dbErr);
          dbInstance = new SQL.Database();
        }
      } else {
        dbInstance = new SQL.Database();
      }

      createSchema(dbInstance);
      seedInitialData(dbInstance);
      scheduleSave();

      return dbInstance;
    } catch (err) {
      initPromise = null;
      console.error('initDatabase failed:', err);
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Create tables if they do not exist
 */
function createSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS shift_master (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total_shift_hours REAL NOT NULL,
      allowed_break_minutes INTEGER NOT NULL,
      half_day_hours REAL NOT NULL,
      default_start_time TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      color TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS employee_master (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL,
      default_shift_id TEXT,
      weekly_goal_hours REAL DEFAULT 45.0
    );

    CREATE TABLE IF NOT EXISTS break_types_master (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      default_duration_min INTEGER NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS time_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      day_type TEXT NOT NULL,
      shift_id TEXT NOT NULL,
      punch_in TEXT NOT NULL,
      punch_out TEXT,
      break_minutes INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS break_intervals (
      id TEXT PRIMARY KEY,
      log_id TEXT NOT NULL,
      category TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_minutes INTEGER NOT NULL,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);
    CREATE INDEX IF NOT EXISTS idx_time_logs_employee ON time_logs(employee_id);
    CREATE INDEX IF NOT EXISTS idx_breaks_log ON break_intervals(log_id);
  `);
}

/**
 * Seed initial master data if tables are empty
 */
function seedInitialData(db: Database) {
  const shiftCountResult = db.exec('SELECT COUNT(*) as count FROM shift_master');
  const shiftCount = shiftCountResult[0]?.values[0]?.[0] as number;

  if (shiftCount === 0) {
    // Seed default Shift Master presets
    db.run(
      `INSERT INTO shift_master (id, name, total_shift_hours, allowed_break_minutes, half_day_hours, default_start_time, is_default, color, description)
       VALUES 
       ('shift_standard', 'Standard 9h Shift', 9.0, 80, 4.0, '09:30', 1, '#3b82f6', 'Standard 9-hour corporate shift with 80 mins break allowance'),
       ('shift_core_8h', 'Core 8h Shift', 8.0, 60, 4.0, '09:00', 0, '#10b981', 'Standard 8-hour shift with 60 mins break allowance'),
       ('shift_flexible', 'Flexible 8.5h Shift', 8.5, 75, 4.25, '10:00', 0, '#8b5cf6', 'Flexible arrival with 75 mins total break allowance'),
       ('shift_morning', 'Early Morning 8h', 8.0, 45, 4.0, '07:30', 0, '#f59e0b', 'Early morning production shift with 45 mins break')
      `
    );
  }

  const empCountResult = db.exec('SELECT COUNT(*) as count FROM employee_master');
  const empCount = empCountResult[0]?.values[0]?.[0] as number;

  if (empCount === 0) {
    db.run(
      `INSERT INTO employee_master (id, name, role, department, email, default_shift_id, weekly_goal_hours)
       VALUES 
       ('EMP-1001', 'John Doe', 'Product Specialist', 'Operations', 'john.doe@company.com', 'shift_standard', 45.0),
       ('EMP-1002', 'Sarah Jenkins', 'Team Lead', 'Engineering', 'sarah.j@company.com', 'shift_standard', 45.0)
      `
    );
  }

  const breakCountResult = db.exec('SELECT COUNT(*) as count FROM break_types_master');
  const breakCount = breakCountResult[0]?.values[0]?.[0] as number;

  if (breakCount === 0) {
    db.run(
      `INSERT INTO break_types_master (id, name, default_duration_min, icon, color)
       VALUES
       ('brk_tea_15', 'Tea & Coffee', 15, 'Coffee', '#f59e0b'),
       ('brk_lunch_45', 'Lunch Break', 45, 'Utensils', '#10b981'),
       ('brk_lunch_60', 'Full Lunch', 60, 'Utensils', '#06b6d4'),
       ('brk_short_10', 'Quick Stretch', 10, 'Sparkles', '#8b5cf6'),
       ('brk_custom', 'Custom Duration', 20, 'Clock', '#64748b')
      `
    );
  }

  const settingsCountResult = db.exec('SELECT COUNT(*) as count FROM settings');
  const settingsCount = settingsCountResult[0]?.values[0]?.[0] as number;

  if (settingsCount === 0) {
    db.run(`
      INSERT INTO settings (key, value) VALUES 
      ('active_employee_id', 'EMP-1001'),
      ('active_shift_id', 'shift_standard'),
      ('theme_mode', 'dark')
    `);
  }
}

/**
 * Execute raw SQL query returning typed objects
 */
export function querySql<T = Record<string, any>>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }

  const stmt = dbInstance.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }

  const results: T[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as T;
    results.push(row);
  }
  stmt.free();
  return results;
}

/**
 * Execute a mutating SQL statement (INSERT, UPDATE, DELETE)
 */
export function executeSql(sql: string, params: any[] = []): void {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }

  if (params.length > 0) {
    dbInstance.run(sql, params);
  } else {
    dbInstance.run(sql);
  }
  scheduleSave();
}

/**
 * Export SQLite database as Uint8Array
 */
export function exportDatabase(): Uint8Array {
  if (!dbInstance) throw new Error('Database not initialized.');
  return dbInstance.export();
}

/**
 * Import and replace SQLite database from binary bytes
 */
export async function importDatabase(bytes: Uint8Array): Promise<void> {
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: (file) => `/${file}` });
  }
  if (dbInstance) {
    dbInstance.close();
  }
  dbInstance = new SQL.Database(bytes);
  createSchema(dbInstance);
  await saveToIndexedDB(bytes);
}

/**
 * Reset SQLite Database to defaults
 */
export async function resetDatabase(): Promise<void> {
  if (!SQL) return;
  if (dbInstance) {
    dbInstance.close();
  }
  dbInstance = new SQL.Database();
  createSchema(dbInstance);
  seedInitialData(dbInstance);
  scheduleSave();
}

/**
 * Download SQLite file directly in browser
 */
export function downloadSqliteFile(fileName: string = 'workpulse_master.sqlite'): void {
  const binary = exportDatabase();
  const blob = new Blob([binary as unknown as BlobPart], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
