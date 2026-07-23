import React, { FC, useMemo } from 'react';
import { BoltIcon, Tooltip, makeStyles } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey } from '@modules/analytics-translations';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import MDX from '../../components/markdown/MDX';

interface NewSignalProps {
  count?: string;
  text?: string;
}

const useNewSignalStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  contentWrapper: {
    display: 'inline-block',
    '& > *': {
      display: 'inline-block !important',
      margin: '0 !important',
    },
  },
}));

const NewSignal: FC<NewSignalProps> = ({ count = '1', text = '' }) => {
  const {
    classes: { container, contentWrapper },
  } = useNewSignalStyles();
  const { isNewSignalCountInReportCardEnabled } = useFeatureFlagsForNamespace(
    ['isNewSignalCountInReportCardEnabled'],
    FeatureFlagNamespace.Analytics,
  );
  const { translate } = useRAQIV2TranslationDependencies();
  const numericCount = parseInt(count, 10);

  const tooltipText = useMemo(() => {
    if (numericCount === 1) {
      return translate(
        translationKey('Label.NewSignal.Single', TranslationNamespace.AnalyticsAssistant),
      );
    }
    return translate(
      translationKey('Label.NewSignal.Multiple', TranslationNamespace.AnalyticsAssistant),
      { num: numericCount.toString() },
    );
  }, [numericCount, translate]);

  // If new signal isn't enabled yet, just render the text
  if (!isNewSignalCountInReportCardEnabled) {
    return <MDX content={text} />;
  }

  return (
    <div className={container}>
      <div className={contentWrapper}>
        <MDX content={text} />
      </div>
      <Tooltip title={tooltipText} arrow placement='top'>
        <BoltIcon color='action' fontSize='large' />
      </Tooltip>
    </div>
  );
};

export default NewSignal;
