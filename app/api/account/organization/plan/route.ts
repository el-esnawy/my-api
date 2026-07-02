import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Organization } from "@/lib/models/Organization";
import { requireSession } from "@/lib/api/dashboardAuth";
import { requireOrgRole } from "@/lib/api/orgAuth";
import { updatePlanInput } from "@/lib/validation/schemas";
import { serializeOrganization } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import { badRequest, notFound, ok, withErrorHandling, zodErrors } from "@/lib/api/respond";

export const runtime = "nodejs";

/**
 * PATCH /api/account/organization/plan — switch plans (owner/admin only).
 * No payment processor: this instantly sets `Organization.plan`. Downgrading
 * doesn't retroactively lock or delete resources already over the new tier's
 * limit — only new resource creation is blocked (see lib/billing/enforceLimit.ts).
 */
export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const roleCheck = requireOrgRole(auth.session, ["owner", "admin"], t);
    if ("response" in roleCheck) return roleCheck.response;

    const body = await req.json().catch(() => null);
    const parsed = updatePlanInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    await connectDB();
    const organization = await Organization.findOneAndUpdate(
      { _id: auth.session.orgId },
      { $set: { plan: parsed.data.plan } },
      { new: true }
    );
    if (!organization) return notFound(t("api.errors.organizationNotFound"));
    return ok({ organization: serializeOrganization(organization) });
  });
}
