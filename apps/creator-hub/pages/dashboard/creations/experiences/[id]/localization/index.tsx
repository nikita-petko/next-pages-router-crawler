import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import LocalizationMetadataContainer from '@modules/localization/localization/container/LocalizationMetadataContainer';

const Localization: NextLayoutPage = () => {
  return (
    <Authenticated>
      <LocalizationMetadataContainer />
    </Authenticated>
  );
};

Localization.getPageLayout = getCreationsPageLayout;
Localization.loggerConfig = { rosId: RosTeams.Localization };

export default Localization;
