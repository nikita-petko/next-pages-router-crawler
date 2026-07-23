import { useCallback } from 'react';
import { Button, clsx, Icon, List } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import emptyStateIllustrations from '@modules/miscellaneous/components/EmptyState/emptyStateIllustrations';
import ThemedImage from '@modules/miscellaneous/components/ThemedImage';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { useListAllPassesForUniverse } from '@modules/passes/queries/useListAllPassesForUniverse';
import { openManagedPricingOnboardingDialog } from '../../dialogs/ManagedPricingAcknowledgementDialog';
import styles from './OnboardingLandingContent.module.css';

type Props = {
  universeId: number;
  className?: string;
};

const VALUE_PROPS = [
  { icon: 'icon-regular-chart-scatter-plot', labelKey: 'Label.OptimizePrices' },
  { icon: 'icon-regular-globe-simplified', labelKey: 'Label.SetRegionalPrices' },
  { icon: 'icon-regular-eye', labelKey: 'Label.BoostDiscovery' },
  { icon: 'icon-regular-chart-three-vertical-bars', labelKey: 'Label.TrackPerformance' },
] as const satisfies { icon: React.ComponentProps<typeof Icon>['name']; labelKey: string }[];

const illustration = emptyStateIllustrations.managedPricing;

function OnboardingLandingContent({ universeId, className }: Props) {
  const { translate } = useTranslation();

  // Prefetch passes to warm the query cache before the user opens the dialog
  useListAllPassesForUniverse(universeId);

  const handleGetStarted = useCallback(() => {
    openManagedPricingOnboardingDialog({ universeId });
  }, [universeId]);

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      <div className='flex flex-col gap-xlarge width-fit'>
        <div className='flex flex-col gap-medium items-center'>
          <ThemedImage
            lightSrc={illustration.light}
            darkSrc={illustration.dark}
            alt=''
            className='height-[180px] min-width-[280px] width-full max-width-[320px]'
          />

          <h1 className={clsx('margin-none padding-bottom-xsmall content-emphasis', styles.title)}>
            {translate('Heading.OnboardingLanding')}
          </h1>
        </div>

        <div className='flex flex-col gap-xxlarge'>
          <List className='flex flex-col width-full'>
            {VALUE_PROPS.map(({ icon, labelKey }) => (
              // Note: intentionally not using ListItem as we have our own overrides here
              <li
                key={labelKey}
                className='flex items-center gap-medium padding-y-small width-full'>
                <Icon name={icon} size='Medium' />
                <span className='text-title-medium content-emphasis'>{translate(labelKey)}</span>
              </li>
            ))}
          </List>

          <Button variant='Emphasis' size='Large' className='width-full' onClick={handleGetStarted}>
            {translate('Action.GetStarted')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default withTranslation(OnboardingLandingContent, [TranslationNamespace.ManagedPricing]);
