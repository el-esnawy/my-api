import { z } from "zod";
import { FIELD_TYPES } from "@/lib/models/DataSchema";
import { HTTP_METHODS } from "@/lib/models/Endpoint";

/** URL-safe slug: lowercase, starts alphanumeric, allows hyphens. */
export const slugRegex = /^[a-z0-9][a-z0-9-]*$/;
/** Valid field/property name (used as a JSON key). */
export const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// --- Auth ---
export const signUpInput = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  name: z.string().trim().max(120).optional(),
});

export const signInInput = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

// --- Schemas (data types) ---
export const schemaFieldInput = z.object({
  name: z.string().trim().regex(fieldNameRegex, "Use letters, numbers, underscores; must not start with a number"),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().optional().default(false),
  unique: z.boolean().optional().default(false),
  enumValues: z.array(z.string()).optional(),
});

export const createSchemaInput = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().toLowerCase().regex(slugRegex, "Invalid slug").max(60),
  fields: z.array(schemaFieldInput).min(1, "Add at least one field"),
});

export const updateSchemaInput = createSchemaInput.partial();

// --- Endpoints ---
export const createEndpointInput = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().toLowerCase().regex(slugRegex, "Invalid slug").max(60),
  schemaId: z.string().min(1),
  methods: z.array(z.enum(HTTP_METHODS)).min(1, "Enable at least one method"),
  readableFields: z.array(z.string()).default([]),
  writableFields: z.array(z.string()).default([]),
});

export const updateEndpointInput = createEndpointInput.partial();

// --- Access tokens ---
export const tokenGrantInput = z.object({
  endpointId: z.string().min(1),
  read: z.boolean().optional().default(true),
  write: z.boolean().optional().default(false),
});

export const createTokenInput = z.object({
  name: z.string().trim().min(1).max(80),
  grants: z.array(tokenGrantInput).min(1, "Grant access to at least one endpoint"),
});

export const updateTokenInput = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    grants: z.array(tokenGrantInput).min(1).optional(),
    revoked: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export type SignUpInput = z.infer<typeof signUpInput>;
export type SignInInput = z.infer<typeof signInInput>;
export type CreateSchemaInput = z.infer<typeof createSchemaInput>;
export type CreateEndpointInput = z.infer<typeof createEndpointInput>;
export type CreateTokenInput = z.infer<typeof createTokenInput>;
