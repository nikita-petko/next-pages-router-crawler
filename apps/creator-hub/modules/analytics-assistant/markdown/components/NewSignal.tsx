import type { FC } from 'react';
import React, { useMemo } from 'react';
import { BoltIcon, Tooltip, makeStyles } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { plainProcessor } from '../getMarkdownProcessor';

const PlainMarkdown: React.FC<{ content?: string }> = ({ content }) => {
  return useMemo(() => {
    if (!content) {
      return null;
    }
    const rendered = plainProcessor.processSync(content).result;
    return <>{rendered}</>;
  }, [content]);
};

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

  return (
    <div className={container}>
      <div className={contentWrapper}>
        <PlainMarkdown content={text} />
      </div>
      <Tooltip title={tooltipText} arrow placement='top'>
        <BoltIcon color='action' fontSize='large' />
      </Tooltip>
    </div>
  );
};

export default NewSignal;
