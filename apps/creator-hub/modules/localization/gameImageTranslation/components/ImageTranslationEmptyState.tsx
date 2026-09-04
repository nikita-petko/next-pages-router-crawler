import type { FunctionComponent } from 'react';
import React from 'react';
import Link from 'next/link';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { EmptyState } from '@modules/miscellaneous/components';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { creatorHub } from '@modules/miscellaneous/urls';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import { imageTranslationLearnMoreUrl } from '../constants';

export type ImageTranslationEmptyStateVariant = 'unsupported' | 'notEnabled' | 'localeNotAvailable';

export interface ImageTranslationEmptyStateProps {
  variant: ImageTranslationEmptyStateVariant;
}

const NAMESPACE = TranslationNamespace.GameImageTranslation;

/**
 * Full-tab empty state for the Images tab. `unsupported` (lock) when the selected language is not
 * supported for image translation; `notEnabled` (translate glyph + CTAs) when it is supported but the
 * creator hasn't turned on automatic image translation for it yet; `localeNotAvailable` (lock) on a
 * specific child locale, since image translation is offered only at the language level. Language name
 * and the Localization route are read from the active translation target / game metadata.
 */
const ImageTranslationEmptyState: FunctionComponent<ImageTranslationEmptyStateProps> = ({
  variant,
}) => {
  const { gameId, activeTranslationTarget } = useEntryManagementMetadata();
  const { translateWithNamespace } = useTranslationWrapper(useTranslation());

  if (variant === 'unsupported') {
    return (
      <EmptyState
        size='large'
        illustration='noPermissions'
        title={translateWithNamespace(NAMESPACE, 'Label.NotAvailable')}
        description={translateWithNamespace(
          NAMESPACE,
          'Message.LanguageNotAvailableForImageTranslation',
          { languageName: activeTranslationTarget?.displayName ?? '' },
        )}
      />
    );
  }

  if (variant === 'localeNotAvailable') {
    return (
      <EmptyState
        size='large'
        illustration='noPermissions'
        title={translateWithNamespace(NAMESPACE, 'Label.NotAvailable')}
        description={translateWithNamespace(
          NAMESPACE,
          'Message.LocaleNotAvailableForImageTranslation',
        )}
      />
    );
  }

  return (
    <EmptyState
      size='large'
      illustration='localization'
      title={translateWithNamespace(NAMESPACE, 'Label.TranslateImagesTitle')}
      description={translateWithNamespace(NAMESPACE, 'Message.TranslateImagesDescription')}>
      <div className='flex gap-medium justify-center'>
        {gameId != null && (
          <Button asChild variant='Emphasis' size='Medium'>
            <Link href={creatorHub.dashboard.getLocalizationUrl(gameId)}>
              {translateWithNamespace(NAMESPACE, 'Action.GoToLanguages')}
            </Link>
          </Button>
        )}
        <Button
          variant='Standard'
          size='Medium'
          onClick={() =>
            window.open(imageTranslationLearnMoreUrl, '_blank', 'noopener,noreferrer')
          }>
          {translateWithNamespace(NAMESPACE, 'Action.LearnMore')}
        </Button>
      </div>
    </EmptyState>
  );
};

export default ImageTranslationEmptyState;
