import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { useMediaQuery } from '@rbx/ui';
import { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import { Link } from '@modules/miscellaneous/components';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type { RAQIV2PageConfig, RAQIV2PageDescriptionSpec } from '../../../types/RAQIV2PageConfig';

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

  const buildDescription = useCallback(
    (spec: RAQIV2PageDescriptionSpec) => {
      if (!ready) {
        return undefined;
      }

      const descriptionKey = isCompactView && spec.mobile ? spec.mobile : spec.standard;

      return (
        <AnalyticsPageDescription
          text={translateHTML(
            descriptionKey,
            descriptionLinks.length > 0 ? descriptionLinks : undefined,
            { linkBreak: <br /> },
          )}
          tooltipText={spec.tooltipText && translate(spec.tooltipText)}
        />
      );
    },
    [descriptionLinks, isCompactView, ready, translate, translateHTML],
  );

  const description = useMemo(
    () => buildDescription(descriptionSpec),
    [buildDescription, descriptionSpec],
  );

  return useMemo(
    () => ({ title, description, buildDescription }),
    [buildDescription, description, title],
  );
};

export default useRAQIV2PredefinedPageControlsBundle;
