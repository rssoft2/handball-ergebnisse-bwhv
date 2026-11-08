const DB_NAME = 'h4a-reports'
const DB_VERSION = 1
const STORE = 'reports'
const LEGACY_PREFIX = 'h4a:report:'
const LEGACY_CURRENT_PREFIX = 'h4a:report:v5:'

let dbPromise = null
let persistRequested = false

function hasIndexedDb() {
  return typeof indexedDB !== 'undefined' && indexedDB !== null
}

function requestPersistentStorage() {
  if (persistRequested) return
  persistRequested = true
  try {
    navigator.storage?.persist?.().catch(() => {})
  } catch {
    /* nicht verfügbar – ignorieren */
  }
}

function openDb() {
  if (!hasIndexedDb()) return Promise.reject(new Error('IndexedDB nicht verfügbar'))
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'sGID' })
        }
      }
      request.onsuccess = () => {
        const db = request.result
        db.onversionchange = () => {
          db.close()
          dbPromise = null
        }
        requestPersistentStorage()
        resolve(db)
      }
      request.onerror = () => {
        dbPromise = null
        reject(request.error)
      }
      request.onblocked = () => {
        dbPromise = null
        reject(new Error('IndexedDB blockiert'))
      }
    })
  }
  return dbPromise
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error || new Error('IndexedDB-Transaktion abgebrochen'))
  })
}

async function putRecord(record) {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(record)
  await transactionDone(tx)
}

export async function readReportRecord(sGID) {
  if (!sGID) return null
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(String(sGID))
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

export async function writeReportRecord(record) {
  if (!record?.sGID) return false
  const value = { ...record, sGID: String(record.sGID) }
  try {
    await putRecord(value)
    return true
  } catch {
    if (!value.text) return false
    try {
      await putRecord({ ...value, text: null })
      return true
    } catch {
      return false
    }
  }
}

function legacyKeys() {
  const keys = []
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(LEGACY_PREFIX)) keys.push(key)
    }
  } catch {
    /* localStorage nicht verfügbar */
  }
  return keys
}

export async function migrateLegacyReportCache(parserVersion) {
  const result = { migrated: 0, removed: 0, skipped: 0 }
  for (const key of legacyKeys()) {
    if (!key.startsWith(LEGACY_CURRENT_PREFIX)) {
      try {
        window.localStorage.removeItem(key)
        result.removed += 1
      } catch {
        result.skipped += 1
      }
      continue
    }

    let entry
    try {
      entry = JSON.parse(window.localStorage.getItem(key))
    } catch {
      entry = null
    }
    const sGID = key.slice(LEGACY_CURRENT_PREFIX.length)
    if (!entry?.v || !sGID) {
      try {
        window.localStorage.removeItem(key)
        result.removed += 1
      } catch {
        result.skipped += 1
      }
      continue
    }

    const written = await writeReportRecord({
      sGID,
      parsed: entry.v,
      text: null,
      parserVersion,
      storedAt: Number(entry.t) || Date.now(),
    })
    if (!written) {
      result.skipped += 1
      continue
    }
    try {
      window.localStorage.removeItem(key)
      result.migrated += 1
    } catch {
      result.skipped += 1
    }
  }
  return result
}
