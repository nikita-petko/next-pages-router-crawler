import React, { ReactNode, useMemo } from 'react';
import { useMediaQuery } from '@rbx/ui';
import { AnalyticsPageDescription, AnalyticsPageTitle } from '@modules/charts-generic';
import { Link } from '@modules/miscellaneous/common';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { RAQIV2PageConfig } from '../../../types/RAQIV2PageConfig';

const useRAQIV2PredefinedPageControlsBundle = (config: RAQIV2PageConfig) => {
  const { title: titleKey, description: descriptionSpec } = config;
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('XSmall'));
  const { translate, translateHTML, ready } = useRAQIV2TranslationDependencies();

  const translatedTitle = translate(titleKey);
  const title = useMemo(() => <AnalyticsPageTitle text={translatedTitle} />, [translatedTitle]);

  const descriptionLinks = useMemo(
    () =>
      config.docLinks.map((link, index) => ({
        opening: `linkStart${index === 0 ? '' : index}`,
        closing: `linkEnd${index === 0 ? '' : index}`,
        content: (chunks: ReactNode) => {
          return (
            <Link href={link} target='_blank' underline='always' color='inherit'>
              {chunks}
            </Link>
          );
        },
      })),
    [config.docLinks],
  );

  const description = useMemo(() => {
    if (!ready) {
      return undefined;
    }

    const descriptionKey = (isCompactView && descriptionSpec.mobile) || descriptionSpec.standard;

    return (
      <AnalyticsPageDescription
        text={translateHTML(
          descriptionKey,
          descriptionLinks.length > 0 ? descriptionLinks : undefined,
        )}
        tooltipText={descriptionSpec.tooltipText && translate(descriptionSpec.tooltipText)}
      />
    );
  }, [
    descriptionLinks,
    descriptionSpec.mobile,
    descriptionSpec.standard,
    descriptionSpec.tooltipText,
    isCompactView,
    ready,
    translate,
    translateHTML,
  ]);

  return useMemo(() => ({ title, description }), [description, title]);
};

export default useRAQIV2PredefinedPageControlsBundle;
