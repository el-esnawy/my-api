import { randomBytes } from "crypto";
import { Organization, type OrganizationDoc } from "@/lib/models/Organization";
import { Membership } from "@/lib/models/Membership";
import type { UserDoc } from "@/lib/models/User";

/** URL-safe-ish slug seed from an email local-part, deduped with a random suffix. */
function slugify(email: string): string {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "org"}-${randomBytes(3).toString("hex")}`;
}

/** Creates a personal organization + owner membership for a brand-new user. */
export async function createOrganizationForUser(user: UserDoc): Promise<OrganizationDoc> {
  const organization = await Organization.create({
    name: `${user.name || user.email}'s workspace`,
    slug: slugify(user.email),
    plan: "hobby",
    ownerId: user._id,
  });

  await Membership.create({
    organizationId: organization._id,
    userId: user._id,
    role: "owner",
  });

  return organization;
}

/** v1 assumes exactly one membership per user. */
export async function getMembershipForUser(userId: string) {
  return Membership.findOne({ userId });
}
