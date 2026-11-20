import { MongoClient } from "mongodb";

let dbPromise;

export function getDb() {
  if (!dbPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    dbPromise = client
      .connect()
      .then((connected) => connected.db(process.env.DB_NAME || "fixmate"))
      .catch((error) => {
        dbPromise = undefined;
        throw error;
      });
  }
  return dbPromise;
}

export async function getCollections() {
  const db = await getDb();
  return {
    // BetterAuth nijer user collection er naam "user" (singular) rakhe
    users: db.collection("user"),
    services: db.collection("services"),
    bookings: db.collection("bookings"),
    payments: db.collection("payments"),
  };
}