import { IDBPDatabase, openDB } from 'idb'

export const DB_KEY = 'EMJ'
export const STORE_KEY = 'emojis'
export const DB_VERSION = 4

// Add this check before attempting IndexedDB operations
function isIndexedDBAvailable() {
  try {
    return (
      'indexedDB' in window &&
      indexedDB !== null &&
      typeof indexedDB.open === 'function'
    )
  } catch (e) {
    return false
  }
}

// Version checking for iOS
function getiOSVersion() {
  const agent = window.navigator.userAgent
  const start = agent.indexOf('OS ')
  if (
    (agent.indexOf('iPhone') > -1 || agent.indexOf('iPad') > -1) &&
    start > -1
  ) {
    return parseInt(agent.substring(start + 3, agent.indexOf(' ', start)), 10)
  }
  return null
}

async function initialize(): Promise<IDBPDatabase | []> {
  if (!isIndexedDBAvailable()) {
    return []
  }

  const iOSVersion = getiOSVersion()
  const usePrivateMode = iOSVersion && iOSVersion < 13 // Private mode detection for older iOS

  if (usePrivateMode) {
    // Test write to detect private mode
    try {
      window.localStorage.setItem('test', '1')
      window.localStorage.removeItem('test')
    } catch (e) {
      return []
    }
  }

  try {
    const db = await openDB(DB_KEY, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db?.objectStoreNames?.contains(STORE_KEY)) {
          const store = db.createObjectStore(STORE_KEY, {
            keyPath: 'id',
            autoIncrement: true,
          })
          store.createIndex('id', 'id', {
            unique: true,
          })
        }
      },
      async blocked() {
        await db.close()
      },
      async blocking() {
        await db.close()
      },
    })
    return db
  } catch (error) {
    // Database errors are expected when db is deleted or not available
    return []
  }
}

export default initialize
