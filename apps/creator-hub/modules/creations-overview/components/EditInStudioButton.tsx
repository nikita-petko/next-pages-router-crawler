import type { FC } from 'react';
import { useCallback } from 'react';
import { Button } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { useStudioEditPlaceLauncher } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';

const { docs } = creatorHub;

type EditInStudioButtonProps = {
  universeId: number;
  placeId: number;
  onClick?: () => void;
  size: 'small' | 'medium' | 'large';
  enableAudienceReachOnOverviewPage: boolean;
};

const EditInStudioButton: FC<EditInStudioButtonProps> = ({
  universeId,
  placeId,
  size,
  onClick,
  enableAudienceReachOnOverviewPage,
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
      <Button
        size={size}
        color={enableAudienceReachOnOverviewPage ? 'primaryBrand' : 'secondary'}
        variant='contained'
        href={docs.getSettingUpStudioUrl()}
        component='a'>
        {translate(translationKey('Action.EditInStudio', TranslationNamespace.Creations))}
      </Button>
    );
  }
  return (
    <>
      <Button
        size={size}
        variant='contained'
        color={enableAudienceReachOnOverviewPage ? 'primaryBrand' : 'secondary'}
        onClick={launchStudio}>
        {translate(translationKey('Action.EditInStudio', TranslationNamespace.Creations))}
      </Button>
      {dialog}
    </>
  );
};

export default EditInStudioButton;
