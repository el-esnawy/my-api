/**
 * One-time migration: records used to be owned by endpoints; they are now
 * owned by schemas (endpoints are projections over schema data). This script
 * backfills `schemaId` on any record that predates the change, resolving it
 * through the record's endpoint. Records whose endpoint no longer exists are
 * orphans and get removed.
 *
 * Usage: node scripts/backfill-entries.mjs
 * (reads MONGODB_URI from the environment, defaults to the local docker DB)
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/my-api";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const records = db.collection("records");
  const endpoints = db.collection("endpoints");

  const missing = await records.find({ schemaId: { $exists: false } }).toArray();
  console.log(`Records missing schemaId: ${missing.length}`);

  let updated = 0;
  let orphaned = 0;
  for (const rec of missing) {
    const endpoint = rec.endpointId ? await endpoints.findOne({ _id: rec.endpointId }) : null;
    if (endpoint) {
      await records.updateOne({ _id: rec._id }, { $set: { schemaId: endpoint.schemaId } });
      updated++;
    } else {
      await records.deleteOne({ _id: rec._id });
      orphaned++;
    }
  }

  console.log(`Backfilled: ${updated}, removed orphans: ${orphaned}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
