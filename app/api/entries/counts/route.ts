import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { RecordModel } from "@/lib/models/Record";
import { requireSession } from "@/lib/api/dashboardAuth";
import { ok, withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

/** GET /api/entries/counts — entry counts per schema for the signed-in user. */
export async function GET() {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;

    await connectDB();
    // Aggregation pipelines don't auto-cast strings to ObjectId — cast explicitly.
    const rows = await RecordModel.aggregate([
      { $match: { organizationId: new Types.ObjectId(auth.session.orgId) } },
      { $group: { _id: "$schemaId", count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {};
    for (const row of rows) {
      if (row._id) counts[String(row._id)] = row.count;
    }
    return ok({ counts });
  });
}
