import React, { useMemo } from 'react';
import type { BannerConfiguration } from '@rbx/client-creator-home-api/v1';
import type { UseTranslationResult } from '@rbx/intl';
import { Link } from '@rbx/ui';

type TTranslationTags = Parameters<UseTranslationResult['translateHTML']>[1];
type TTranslationArgs = Parameters<UseTranslationResult['translateHTML']>[2];

const Bold = {
  opening: 'boldStart',
  closing: 'boldEnd',
  content(chunks: React.ReactNode) {
    return <b>{chunks}</b>;
  },
};

const useBannerTranslationParameters = (
  bannerData?: BannerConfiguration,
): {
  tags: TTranslationTags;
  args: TTranslationArgs;
} => {
  const memoizedParameters = useMemo(() => {
    if (!bannerData?.messageVariables) {
      return {
        tags: [],
        args: {},
      };
    }

    const tags: TTranslationTags = [];
    const args: TTranslationArgs = {};
    Object.keys(bannerData.messageVariables)?.forEach((key: string) => {
      const value = bannerData.messageVariables?.[key];

      if (key.endsWith('Link')) {
        tags.push({
          opening: `${key}Start`,
          closing: `${key}End`,
          content(chunks: React.ReactNode) {
            return (
              <Link href={value} target='_blank' color='primary' underline='none'>
                {chunks}
              </Link>
            );
          },
        });
      } else {
        args[key] = value;
      }
    });

    tags.push(Bold);

    return {
      tags,
      args,
    };
  }, [bannerData?.messageVariables]);

  return memoizedParameters;
};

export default useBannerTranslationParameters;
