import React, { FC, useCallback } from 'react';
import { Button } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { urls } from '@modules/miscellaneous/common';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { useStudioEditPlaceLauncher } from '@modules/miscellaneous/hooks';

const {
  creatorHub: { docs },
} = urls;

type EditInStudioButtonProps = {
  universeId: number;
  placeId: number;
  onClick?: () => void;
  size: React.ComponentProps<typeof Button>['size'];
};

const EditInStudioButton: FC<EditInStudioButtonProps> = ({
  universeId,
  placeId,
  size,
  onClick,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { launch, dialog, isCompatible } = useStudioEditPlaceLauncher();

  const launchStudio = useCallback(() => {
    if (onClick) {
      onClick();
    }

    launch(universeId, placeId);
  }, [launch, universeId, placeId, onClick]);

  if (!isCompatible) {
    return (
      <Button size={size} variant='contained' href={docs.getSettingUpStudioUrl()} component='a'>
        {translate(translationKey('Action.EditInStudio', TranslationNamespace.Creations))}
      </Button>
    );
  }
  return (
    <React.Fragment>
      <Button size={size} variant='contained' color='secondary' onClick={launchStudio}>
        {translate(translationKey('Action.EditInStudio', TranslationNamespace.Creations))}
      </Button>
      {dialog}
    </React.Fragment>
  );
};

export default EditInStudioButton;
