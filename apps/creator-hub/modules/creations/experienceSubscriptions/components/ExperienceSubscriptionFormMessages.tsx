import { Fragment, useMemo } from 'react';
import type { FieldError } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Link, Typography } from '@rbx/ui';
import type { TTypographyProps } from '@rbx/ui';
import {
  SUBSCRIPTION_LEARN_MORE_PRICING_URL,
  SUBSCRIPTION_LEARN_MORE_PRODUCT_TYPES_URL,
  SUBSCRIPTION_LEARN_MORE_URL,
} from '@modules/miscellaneous/common/constants/linkConstants';
import LinkType from '../enums/LinkType';

type TTypographyVariant = NonNullable<TTypographyProps['variant']>;

type TExperienceSubscriptionErrorMessageProps = {
  error: FieldError | undefined;
  charCount: number;
  limit: number;
};

type TExperienceSubscriptionSelecterHelperMessageProps = {
  error: FieldError | undefined;
};

type TLearnMoreMessageProps = {
  message: string;
  type: LinkType;
  variant?: TTypographyVariant;
};

export function LearnMoreMessage({ message, type, variant }: TLearnMoreMessageProps) {
  const { translateHTML } = useTranslation();

  const linkUrl = useMemo(() => {
    switch (type) {
      case LinkType.Pricing:
        return SUBSCRIPTION_LEARN_MORE_PRICING_URL;
      case LinkType.ProductTypes:
        return SUBSCRIPTION_LEARN_MORE_PRODUCT_TYPES_URL;
      case LinkType.Authorization:
        return SUBSCRIPTION_LEARN_MORE_URL;
      default:
        return SUBSCRIPTION_LEARN_MORE_URL;
    }
  }, [type]);

  return (
    <Typography variant={variant || 'subtitle2'}>
      {translateHTML(message, [
        {
          opening: 'LinkStart',
          closing: 'LinkEnd',
          content(chunks) {
            return (
              <Link href={linkUrl} target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
      ])}
    </Typography>
  );
}

export function ExperienceSubscriptionLimitErrorMessage({
  error,
  charCount,
  limit,
}: TExperienceSubscriptionErrorMessageProps) {
  const { translate } = useTranslation();

  return (
    <Typography variant='subtitle2'>
      {error && error.message
        ? translate(error.message)
        : translate('Label.CharacterCountLimit', {
            count: charCount.toString(),
            limit: limit.toString(),
          })}
    </Typography>
  );
}

export function ExperienceSubscriptionPriceHelperMessage({
  error,
}: TExperienceSubscriptionSelecterHelperMessageProps) {
  const { translate } = useTranslation();

  return (
    <>
      {error && error.message ? (
        <Typography variant='subtitle2'>{translate(error.message)}</Typography>
      ) : (
        <Fragment>
          <Typography variant='subtitle2'>{translate('Label.PriceInfo')}</Typography>
          <br />
          <LearnMoreMessage message='Message.PriceAndEarningsInfo' type={LinkType.Pricing} />
        </Fragment>
      )}
    </>
  );
}

export function ExperieceSubscriptionStatusHelperMessage({
  error,
}: TExperienceSubscriptionSelecterHelperMessageProps) {
  const { translate } = useTranslation();

  return error && error?.message ? (
    <Typography variant='subtitle2'>{`\n${translate(error.message)}`}</Typography>
  ) : (
    <LearnMoreMessage message='Message.ProductTypeInfo' type={LinkType.ProductTypes} />
  );
}
