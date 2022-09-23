import { openDB } from 'idb'

export const DB_KEY = 'EMJ'
export const STORE_KEY = 'emojis'
export const DB_VERSION = 3

async function initialize() {
  const db = await openDB(DB_KEY, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_KEY)) {
        const store = db.createObjectStore(STORE_KEY, {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('id', 'id', {
          unique: true,
        })
      }
    },
  })
  db.close()
}

export default initialize
