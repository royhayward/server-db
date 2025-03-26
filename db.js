const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

// Ensure the directory exists
const dbDirectory = path.join(__dirname, 'data');
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

// Set up the database file path
const dbPath = path.join(dbDirectory, 'scripture.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

// Set default data structure if the JSON file is empty
db.defaults({
  scriptures: [],
  lastId: 0
}).write();

// Helper functions to mimic SQLite operations
const dbHelper = {
  // Insert a new scripture
  run: (sql, params, callback) => {
    try {
      // Increment the ID counter
      const newId = db.get('lastId').value() + 1;
      db.set('lastId', newId).write();

      // Create timestamp
      const timestamp = new Date().toISOString();

      // Create the new scripture object
      const scripture = {
        id: newId,
        week: params[0],
        year: params[1],
        reference: params[2],
        text: params[3],
        imageUrl: params[4],
        historicalContext: params[5],
        gospelTeaching: params[6],
        personalTestimony: params[7],
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Check for uniqueness of week and year
      const exists = db.get('scriptures')
        .find({ week: params[0], year: params[1] })
        .value();

      if (exists) {
        callback({ message: 'UNIQUE constraint failed: scriptures.week, scriptures.year' });
        return;
      }

      // Add to the database
      db.get('scriptures')
        .push(scripture)
        .write();

      // Call the callback with the lastID
      if (callback) {
        callback.call({ lastID: newId });
      }
    } catch (err) {
      if (callback) {
        callback(err);
      }
    }
  },

  // Get a single scripture by criteria
  get: (sql, params, callback) => {
    try {
      let result;

      // Handle different query types based on params
      if (params.length === 2) {
        // Get by year and week
        result = db.get('scriptures')
          .find({ year: params[0], week: params[1] })
          .value();
      } else if (sql.includes('ORDER BY')) {
        // Get latest scripture
        result = db.get('scriptures')
          .orderBy(['year', 'week'], ['desc', 'desc'])
          .take(1)
          .value()[0];
      }

      callback(null, result);
    } catch (err) {
      callback(err);
    }
  }
};

console.log('Connected to LowDB database at:', dbPath);

module.exports = dbHelper;