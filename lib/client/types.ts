export type FieldType = "string" | "number" | "boolean" | "date" | "enum";
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "PUT_MANY"
  | "PATCH_MANY";

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

export interface Entry {
  id: string;
  data: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ImportRejection {
  index: number;
  entry: Record<string, unknown>;
  reasons: string[];
}

export interface ImportResult {
  total: number;
  imported: number;
  rejected: ImportRejection[];
}

export interface BatchItemError {
  tempId?: string;
  id?: string;
  fields: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string | null;
}
