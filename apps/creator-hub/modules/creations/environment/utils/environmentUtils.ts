import { V2Protos } from '@modules/clients/openCloud';

export const isSpecialEnvironment = (environment: V2Protos.IEnvironment): boolean => {
  return environment.slug === 'live' || environment.slug === 'sandbox';
};

export const slugify = (text: string): string => {
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Ensure slug starts with a letter (required by validation)
  if (slug && !/^[a-z]/.test(slug)) {
    slug = `env-${slug}`;
  }

  return slug;
};

export const validateEnvironmentSlug = (slug: string): string | null => {
  if (!slug || slug.trim() === '') {
    return null;
  }

  if (slug.length > 36) {
    return 'Error.EnvironmentSlugTooLong';
  }

  if (!/^[a-z]/.test(slug)) {
    return 'Error.EnvironmentSlugMustStartWithLetter';
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return 'Error.EnvironmentSlugInvalidCharacters';
  }

  return null;
};
