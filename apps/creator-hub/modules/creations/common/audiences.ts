// Audience values returned by Develop v1/v2 universe configuration endpoints.
// Numeric values match the OpenAPI-generated UniverseAudience enum but use
// readable names for use across the creator-hub.
export enum Audience {
  Editors = 1,
  PlayTesters = 2,
  Friends = 3,
  Public = 4,
}

// Widened to plain `number` so callers can pass values from the OpenAPI
// numeric-literal union without an enum-vs-number lint flag.
const EDITORS_AUDIENCE: number = Audience.Editors;

// `[]` and `undefined` are treated as not-private; layer extra checks on top
// if you need to distinguish them.
export const isPrivateAudience = (audiences: number[] | undefined): boolean =>
  audiences?.length === 1 && audiences[0] === EDITORS_AUDIENCE;

export const hasPlayableAudience = (audiences: number[] | undefined): boolean =>
  !!audiences?.some((value) => value !== EDITORS_AUDIENCE);
