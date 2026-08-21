/**
 * Nominal ("branded") types. A `Branded<string, 'Foo'>` is an ordinary string at
 * runtime, but the compiler will not let it be swapped with a plain string or
 * with a different brand.
 *
 * As with `NonEmptyArray`, the unchecked cast that produces a branded value is
 * confined to this module so call sites never have to spell out — or suppress —
 * an assertion of their own. Branding asserts nothing about the value itself:
 * satisfying the brand's documented contract remains the caller's job.
 */
export type Branded<Base extends string | number, Tag extends string> = Base & { __brand: Tag };

export const brandString = <B extends string>(value: string): B =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a brand is a compile-time-only tag with no runtime representation
  value as B;

export const brandNumber = <B extends number>(value: number): B =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a brand is a compile-time-only tag with no runtime representation
  value as B;
