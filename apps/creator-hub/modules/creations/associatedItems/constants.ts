import { Item } from '@modules/miscellaneous/common';
import { creatorHub } from '@modules/miscellaneous/urls';

export const associatedItemsRedirectUrls = {
  [Item.DeveloperProduct]: creatorHub.dashboard.getMonetizationDeveloperProductsUrl,
  [Item.GamePass]: creatorHub.dashboard.getMonetizationPassesUrl,
  [Item.CatalogAsset]: creatorHub.dashboard.getMonetizationAvatarItemsUrl,
  [Item.ExperienceSubscription]: creatorHub.dashboard.getMonetizationSubscriptionsUrl,
  [Item.Badge]: undefined,
} as const satisfies Record<string | Item, ((universeId: number) => string) | undefined>;

type DefinedKeys<T> = {
  [K in keyof T]: T[K] extends undefined ? never : K;
}[keyof T];

export type AssociatedItem = keyof typeof associatedItemsRedirectUrls;

export type RedirectedAssociatedItem = DefinedKeys<typeof associatedItemsRedirectUrls>;
