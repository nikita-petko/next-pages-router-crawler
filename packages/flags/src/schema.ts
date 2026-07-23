import { z } from 'zod';

function perEnvironment<T extends z.ZodType>(valueSchema: T) {
  return z.object({
    dev: valueSchema.optional(),
    staging: valueSchema.optional(),
    prod: valueSchema.optional(),
  });
}

const baseFilters = {
  userId: perEnvironment(z.array(z.number())).optional(),
  roleSet: perEnvironment(z.array(z.string())).optional(),
};
const contextIds = perEnvironment(z.array(z.number()));

const metadataSchema = z.object({
  description: z.string(),
  creationDate: z.iso.date(),
});

const filtersSchema = z.xor([
  z.strictObject({ ...baseFilters, universeId: contextIds }),
  z.strictObject({ ...baseFilters, groupId: contextIds }),
  z.strictObject({ ...baseFilters }),
]);

const baseFlagSchema = z.object({
  name: z.string(),
  metadata: metadataSchema,
  filters: filtersSchema.optional(),
});

const booleanFlagSchema = baseFlagSchema.extend({
  type: z.literal('boolean'),
  defaultValue: z.boolean(),
  value: perEnvironment(z.boolean()).optional(),
});

const numberFlagSchema = baseFlagSchema.extend({
  type: z.literal('number'),
  defaultValue: z.number(),
  value: perEnvironment(z.number()).optional(),
});

const stringFlagSchema = baseFlagSchema.extend({
  type: z.literal('string'),
  defaultValue: z.string(),
  value: perEnvironment(z.string()).optional(),
});

const flagSchema = z.discriminatedUnion('type', [
  booleanFlagSchema,
  numberFlagSchema,
  stringFlagSchema,
]);

const flagValueSchema = z.union([z.boolean(), z.number(), z.string()]);

const namespaceResponseBaseSchema = z.object({
  applicationId: z.string(),
  namespace: z.string(),
});

export const namespaceFileSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  owner: z.string(),
  slack: z.string(),
  slackNotificationChannel: z.string().optional(),
  flags: z.array(flagSchema),
});

export const staticNamespaceResponseSchema = namespaceResponseBaseSchema.extend({
  flags: z.record(z.string(), flagValueSchema),
});

const contextualFlagValueSchema = z
  .union([
    z.object({ universeId: z.record(z.string(), flagValueSchema) }),
    z.object({ groupId: z.record(z.string(), flagValueSchema) }),
  ])
  .transform((value) => {
    const [flagValue] =
      'universeId' in value ? Object.values(value.universeId) : Object.values(value.groupId);
    return flagValue;
  })
  .pipe(flagValueSchema);

export const contextualNamespaceResponseSchema = namespaceResponseBaseSchema.extend({
  flags: z.record(z.string(), z.union([flagValueSchema, contextualFlagValueSchema])),
});

export const overrideResponseSchema = z.object({
  isOverrideAllowed: z.boolean(),
});

export type NamespaceFile = z.infer<typeof namespaceFileSchema>;
export type Flag = z.infer<typeof flagSchema>;
export type FlagType = Flag['type'];
export type Environment = 'dev' | 'staging' | 'prod';
