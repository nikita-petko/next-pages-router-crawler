import { Item, urls } from '@modules/miscellaneous/common';

export const associatedItemsRedirectUrls = {
  [Item.DeveloperProduct]: urls.creatorHub.dashboard.getMonetizationDeveloperProductsUrl,
  [Item.GamePass]: urls.creatorHub.dashboard.getMonetizationPassesUrl,
  [Item.CatalogAsset]: urls.creatorHub.dashboard.getMonetizationAvatarItemsUrl,
  [Item.ExperienceSubscription]: urls.creatorHub.dashboard.getMonetizationSubscriptionsUrl,
  [Item.Badge]: undefined,
} as const satisfies Record<string | Item, ((universeId: number) => string) | undefined>;

type DefinedKeys<T> = {
  [K in keyof T]: T[K] extends undefined ? never : K;
}[keyof T];

export type AssociatedItem = keyof typeof associatedItemsRedirectUrls;

export type RedirectedAssociatedItem = DefinedKeys<typeof associatedItemsRedirectUrls>;
