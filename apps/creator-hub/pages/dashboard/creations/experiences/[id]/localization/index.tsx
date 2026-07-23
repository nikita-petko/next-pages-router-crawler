import type { NextLayoutPage } from 'next';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import LocalizationMetadataContainer from '@modules/localization/localization/container/LocalizationMetadataContainer';
import { getCreationsPageLayout } from '@modules/creations';
import Authenticated from '@modules/authentication/Authenticated';

const Localization: NextLayoutPage = () => {
  return (
    <Authenticated>
      <LocalizationMetadataContainer />
    </Authenticated>
  );
};

Localization.getPageLayout = getCreationsPageLayout;

export default Localization;
