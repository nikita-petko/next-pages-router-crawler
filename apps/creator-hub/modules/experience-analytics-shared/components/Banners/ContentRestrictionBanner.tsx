import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { Alert, Link, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useContentRestriction from './useContentRestriction';

const RESTRICTION_DETAILS_URL = `${getProductionCreatorHubUrl(
  process.env.buildTarget,
)}/docs/production/promotion/regional-content-availability`;

interface ContentRestrictionBannerProps {
  contentId: string;
  contentType: string;
}

// ContentRestrictionBanner shows which countries your content is restricted in
const ContentRestrictionBanner = ({ contentId, contentType }: ContentRestrictionBannerProps) => {
  const { description, shouldDisplay, isLoading } = useContentRestriction(contentId, contentType);
  const { translate } = useTranslationWrapper(useTranslation());

  if (isLoading || !shouldDisplay) {
    return null;
  }
  return (
    <Alert severity='info'>
      <Typography variant='body1'>
        {description}
        &nbsp;
        <Link href={RESTRICTION_DETAILS_URL} target='_blank' color='inherit' underline='always'>
          {translate(
            translationKey(
              'Heading.ContentRestricted.BannerViewDetailsLink',
              TranslationNamespace.AccessPolicy,
            ),
          )}
        </Link>
      </Typography>
    </Alert>
  );
};

export default withNamespaceSwitchedTranslation(ContentRestrictionBanner, [
  TranslationNamespace.AccessPolicy,
]);
