/**
 * One-time migration: the app used to be single-user-tenant (every
 * DataSchema/Endpoint/AccessToken/Record had a direct `userId`). It is now
 * organization-tenant (those documents have `organizationId`, and `userId`
 * became `createdBy`). This script backfills a personal Organization +
 * owner Membership for every existing User, then re-points their existing
 * data at that organization.
 *
 * Idempotent — safe to re-run. Users that already have a Membership are
 * skipped; documents that already have `organizationId` are skipped.
 *
 * Usage: node scripts/backfill-organizations.mjs
 * (reads MONGODB_URI from the environment, defaults to the local docker DB)
 */
import mongoose from "mongoose";
import { randomBytes } from "crypto";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/my-api";

function slugify(email) {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "org"}-${randomBytes(3).toString("hex")}`;
}

async function backfillOwnerOrgs(db) {
  const users = db.collection("users");
  const organizations = db.collection("organizations");
  const memberships = db.collection("memberships");

  const allUsers = await users.find({}).toArray();
  const userToOrg = new Map();
  let orgsCreated = 0;

  for (const user of allUsers) {
    const existing = await memberships.findOne({ userId: user._id });
    if (existing) {
      userToOrg.set(String(user._id), existing.organizationId);
      continue;
    }

    const now = new Date();
    const org = {
      name: `${user.name || user.email}'s workspace`,
      slug: slugify(user.email),
      plan: "hobby",
      ownerId: user._id,
      createdAt: now,
      updatedAt: now,
    };
    const orgResult = await organizations.insertOne(org);
    await memberships.insertOne({
      organizationId: orgResult.insertedId,
      userId: user._id,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });
    userToOrg.set(String(user._id), orgResult.insertedId);
    orgsCreated++;
  }

  console.log(`Users: ${allUsers.length}, organizations created: ${orgsCreated}`);
  return userToOrg;
}

async function backfillCollection(db, collectionName, userToOrg) {
  const col = db.collection(collectionName);
  const missing = await col.find({ organizationId: { $exists: false } }).toArray();
  console.log(`${collectionName}: ${missing.length} documents missing organizationId`);

  let updated = 0;
  let skippedNoOwner = 0;
  const ops = [];
  for (const doc of missing) {
    const orgId = userToOrg.get(String(doc.userId));
    if (!orgId) {
      skippedNoOwner++;
      continue;
    }
    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { organizationId: orgId, createdBy: doc.userId }, $unset: { userId: "" } },
      },
    });
  }

  for (let i = 0; i < ops.length; i += 500) {
    const batch = ops.slice(i, i + 500);
    if (batch.length) await col.bulkWrite(batch);
    updated += batch.length;
  }

  console.log(`${collectionName}: backfilled ${updated}, skipped (no resolvable owner) ${skippedNoOwner}`);
}

async function dropOldIndexIfPresent(db, collectionName, indexName) {
  try {
    await db.collection(collectionName).dropIndex(indexName);
    console.log(`${collectionName}: dropped index ${indexName}`);
  } catch (err) {
    if (err?.codeName !== "IndexNotFound") throw err;
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const userToOrg = await backfillOwnerOrgs(db);

  // Drop the old per-user unique indexes BEFORE backfilling. Once a document's
  // userId is $unset it reads as null, and while the old {userId,slug} unique
  // index is still live, multiple docs briefly sharing userId:null collide on
  // any repeated slug (e.g. two different users both naming a schema "note").
  // Mongoose recreates the new {organizationId,slug} indexes automatically the
  // next time the app connects (autoIndex is on).
  await dropOldIndexIfPresent(db, "dataschemas", "userId_1_slug_1");
  await dropOldIndexIfPresent(db, "endpoints", "userId_1_slug_1");
  await dropOldIndexIfPresent(db, "accesstokens", "userId_1");
  await dropOldIndexIfPresent(db, "records", "schemaId_1_userId_1_createdAt_-1");

  for (const name of ["dataschemas", "endpoints", "accesstokens", "records"]) {
    await backfillCollection(db, name, userToOrg);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
