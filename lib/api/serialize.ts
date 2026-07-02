/* Convert Mongoose docs into plain JSON-safe objects with string ids.
   Sensitive fields (passwordHash, tokenHash) are never included. */

export function serializeUser(doc: any) {
  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name ?? null,
    createdAt: doc.createdAt ?? null,
  };
}

export function serializeSchema(doc: any) {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    fields: (doc.fields ?? []).map((f: any) => ({
      name: f.name,
      type: f.type,
      required: !!f.required,
      unique: !!f.unique,
      enumValues: f.enumValues ?? null,
    })),
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

export function serializeEndpoint(doc: any) {
  const methods = doc.methods ?? [];
  const usesSplitReadMethods = doc.methodsVersion === 2 || methods.includes("GET_MANY");
  const serializedMethods =
    !usesSplitReadMethods && methods.includes("GET")
      ? ["GET_MANY", ...methods]
      : methods;

  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    schemaId: String(doc.schemaId),
    methods: serializedMethods,
    readableFields: doc.readableFields ?? [],
    writableFields: doc.writableFields ?? [],
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

export function serializeToken(doc: any) {
  return {
    id: String(doc._id),
    name: doc.name,
    tokenPrefix: doc.tokenPrefix,
    grants: (doc.grants ?? []).map((g: any) => ({
      endpointId: String(g.endpointId),
      read: !!g.read,
      write: !!g.write,
    })),
    lastUsedAt: doc.lastUsedAt ?? null,
    revoked: !!doc.revoked,
    createdAt: doc.createdAt ?? null,
  };
}

export function serializeRecord(doc: any) {
  return {
    id: String(doc._id),
    data: doc.data ?? {},
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

export function serializeOrganization(doc: any) {
  return {
    id: String(doc._id),
    name: doc.name,
    plan: doc.plan,
    createdAt: doc.createdAt ?? null,
  };
}

/** `doc` must be a Membership populated with `userId` (email/name). */
export function serializeMember(doc: any) {
  const user = doc.userId && typeof doc.userId === "object" ? doc.userId : null;
  return {
    id: String(doc._id),
    userId: user ? String(user._id) : String(doc.userId),
    email: user?.email ?? null,
    name: user?.name ?? null,
    role: doc.role,
    createdAt: doc.createdAt ?? null,
  };
}

export function serializeInvite(doc: any) {
  return {
    id: String(doc._id),
    email: doc.email,
    role: doc.role,
    status: doc.status,
    expiresAt: doc.expiresAt ?? null,
    createdAt: doc.createdAt ?? null,
  };
}
