import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type CopySnippetButtonProps = {
  onClick: () => void;
};

const CopySnippetButton: FC<CopySnippetButtonProps> = ({ onClick }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  return (
    <Button variant='contained' color='secondary' onClick={onClick}>
      {translate(
        translationKey('Action.Copy', TranslationNamespace.UniverseConfigAndExperimentation),
      )}
    </Button>
  );
};

export default CopySnippetButton;
