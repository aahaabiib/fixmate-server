import "dotenv/config";
import { getDb } from "../src/config/db.js";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;

async function main() {
  const db = await getDb();
  const users = db.collection("user");

  const seedUsers = await users
    .find({
      email: { $regex: /@fixmate\.dev$/i, $ne: ADMIN_EMAIL },
    })
    .toArray();

  if (seedUsers.length === 0) {
    console.log("No seed users found.");
    return;
  }

  const ids = seedUsers.flatMap((u) => [u._id, String(u._id)]);
  const emails = seedUsers.map((u) => u.email);

  const acc = await db.collection("account").deleteMany({ userId: { $in: ids } });
  const ses = await db.collection("session").deleteMany({ userId: { $in: ids } });
  const usr = await users.deleteMany({ email: { $in: emails } });

  console.log(
    `Deleted ${usr.deletedCount} users, ${acc.deletedCount} accounts, ${ses.deletedCount} sessions`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Reset failed:", err.message);
    process.exit(1);
  });