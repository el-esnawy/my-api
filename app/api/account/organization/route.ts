import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Organization } from "@/lib/models/Organization";
import { requireSession } from "@/lib/api/dashboardAuth";
import { requireOrgRole } from "@/lib/api/orgAuth";
import { updateOrganizationInput } from "@/lib/validation/schemas";
import { serializeOrganization } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import { badRequest, notFound, ok, withErrorHandling, zodErrors } from "@/lib/api/respond";

export const runtime = "nodejs";

/** GET /api/account/organization — the current org (any member can read it). */
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;

    await connectDB();
    const organization = await Organization.findById(auth.session.orgId);
    if (!organization) return notFound(t("api.errors.organizationNotFound"));
    return ok({ organization: serializeOrganization(organization) });
  });
}

/** PATCH /api/account/organization — rename the org (owner/admin only). */
export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const roleCheck = requireOrgRole(auth.session, ["owner", "admin"], t);
    if ("response" in roleCheck) return roleCheck.response;

    const body = await req.json().catch(() => null);
    const parsed = updateOrganizationInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    await connectDB();
    const organization = await Organization.findOneAndUpdate(
      { _id: auth.session.orgId },
      { $set: { name: parsed.data.name } },
      { new: true }
    );
    if (!organization) return notFound(t("api.errors.organizationNotFound"));
    return ok({ organization: serializeOrganization(organization) });
  });
}
