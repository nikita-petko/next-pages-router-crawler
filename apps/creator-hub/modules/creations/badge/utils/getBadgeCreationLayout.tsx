import React, { ReactNode } from 'react';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import { getCreationsPageLayout, TGetCreationsPageLayoutContext } from '@modules/creations/common';

const getBadgeCreationLayout = (page: ReactNode, context: TGetCreationsPageLayoutContext) => {
  return getCreationsPageLayout(
    <LanguageManagementProvider>{page}</LanguageManagementProvider>,
    context,
  );
};

export default getBadgeCreationLayout;
