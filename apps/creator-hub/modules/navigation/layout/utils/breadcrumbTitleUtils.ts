import type {
  BreadcrumbItemDetails,
  getDisplayNameParams,
} from '../constants/BreadcrumbsItemConstants';

type BreadcrumbMap = { [key: string]: BreadcrumbItemDetails };
type ItemNameMapping = { [key: string]: string | undefined };

/**
 * Walk the URL path segments and resolve display names via the breadcrumb
 * map. For `withId` items whose entity name is available in
 * `itemNameMapping`, both the category display name and the entity name
 * are included (e.g. "Games", "My Cool Game").
 *
 * Used by `computeSeoTitle` to build the SEO `<title>`.
 */
export function collectBreadcrumbItems(
  path: string[],
  breadcrumbMap: BreadcrumbMap,
  displayNameParam: getDisplayNameParams,
  itemNameMapping: ItemNameMapping,
): string[] {
  const items: string[] = [];

  path
    .filter((segment) => breadcrumbMap[segment])
    .forEach((segment) => {
      const currentItem = breadcrumbMap[segment];
      const displayName = currentItem.displayName(displayNameParam);
      // Skip segments that resolve to an empty name (e.g. the ticket-detail
      // route segment, which exists only to make its parent crumb a link).
      if (displayName) {
        items.push(displayName);
      }
      if (currentItem.withId) {
        const itemName = itemNameMapping[currentItem.breadcrumbType];
        if (itemName) {
          items.push(itemName);
        }
      }
    });

  return items;
}

/**
 * SEO `<title>` from breadcrumb segments: last two items joined by ` / `.
 * Returns `undefined` when fewer than two items exist or when either
 * of the last two items is empty (translate can return `""` on startup).
 */
export function computeSeoTitle(items: string[]): string | undefined {
  if (items.length < 2) {
    return undefined;
  }
  const lastItem = items[items.length - 1];
  const secondLastItem = items[items.length - 2];
  if (!lastItem || !secondLastItem) {
    return undefined;
  }
  return `${secondLastItem} / ${lastItem}`;
}

export type ExperienceHubMetaProps = {
  description?: string;
  author?: string;
  entityName?: string;
  entityId?: string;
  type?: string;
};

/**
 * Derive experience-specific HubMeta props from the current pathname
 * and game details. Returns an empty object for non-experience pages.
 */
export function getExperienceHubMetaProps(
  pathname: string,
  gameDetails?: { id?: number; name?: string; creator?: { name?: string } } | null,
): ExperienceHubMetaProps {
  if (!pathname.includes('/experiences/')) {
    return {};
  }

  return {
    description: gameDetails?.name,
    author: gameDetails?.creator?.name,
    entityName: gameDetails?.name,
    entityId: gameDetails?.id?.toString(),
    type: 'experience',
  };
}
