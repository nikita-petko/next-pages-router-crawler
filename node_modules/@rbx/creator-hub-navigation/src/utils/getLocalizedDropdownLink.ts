const docsPageLocaleRegex = /^\/docs\/([a-z]{2}-[a-z]{2,3})/;

export const getDocsLocaleFromPath = (currentPath: string): string => {
  const match = currentPath.match(docsPageLocaleRegex);
  return match?.[1] || '';
};

export const getLocalizedDropdownLink = ({
  currentPath,
  itemPath,
}: {
  currentPath: string;
  itemPath: string;
}): string => {
  const locale = getDocsLocaleFromPath(currentPath);
  return locale ? `/${locale}${itemPath}` : itemPath;
};
