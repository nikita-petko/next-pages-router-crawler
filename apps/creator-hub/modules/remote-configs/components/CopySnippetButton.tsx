import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import React, { FC } from 'react';

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
