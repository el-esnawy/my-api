export type FieldType = "string" | "number" | "boolean" | "date";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface SchemaField {
  name: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  enumValues: string[] | null;
}

export interface DataSchema {
  id: string;
  name: string;
  slug: string;
  fields: SchemaField[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Endpoint {
  id: string;
  name: string;
  slug: string;
  schemaId: string;
  methods: HttpMethod[];
  readableFields: string[];
  writableFields: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TokenGrant {
  endpointId: string;
  read: boolean;
  write: boolean;
}

export interface AccessToken {
  id: string;
  name: string;
  tokenPrefix: string;
  grants: TokenGrant[];
  lastUsedAt: string | null;
  revoked: boolean;
  createdAt: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string | null;
}
