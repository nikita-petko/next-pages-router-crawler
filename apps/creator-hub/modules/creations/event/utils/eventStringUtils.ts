import type { EventCategory } from '@rbx/client-virtual-events-api/v1';
import { EventVisibility } from '@rbx/client-virtual-events-api/v1';

export const visibilityToTranslationKey = (visibility: EventVisibility): string => {
  switch (visibility) {
    case EventVisibility.Public:
      return 'Label.Public';
    case EventVisibility.Private:
    case EventVisibility.Moderated:
      return 'Label.Private';
    default:
      return 'Error.UnknownError';
  }
};

export const categoryToTranslationKey = (category: EventCategory): string => {
  if (!category) {
    return '';
  }
  const capitalizedCategory = category[0].toUpperCase() + category.slice(1);
  return `Label.EE${capitalizedCategory}`;
};
