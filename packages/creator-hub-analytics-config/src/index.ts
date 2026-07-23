export * from '@rbx/creator-analytics-config';

// Shadow upstream `teamOwnershipByMetric` so creator-hub callers cannot pull
// raw team slugs through this proxy. ES modules give a local named export
// precedence over `export *`, and the `never` type makes any usage a type
// error. Use `teamOwnershipByMetric` from `@rbx/ownership-watermark` for the
// client-safe metric → opaque teamId lookup.
// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- deliberate shadow export; callers should use @rbx/ownership-watermark instead
export const teamOwnershipByMetric: never = undefined as never;
