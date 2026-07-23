import { ProductStatusType } from '@rbx/client-developer-subscriptions-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { TTypographyProps } from '@rbx/ui';
import { Typography, Skeleton } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type Props = {
  productStatus: ProductStatusType;
  isLoading: boolean;
};

function decodeProductStatusType(productStatus: ProductStatusType): {
  displayString: string;
  textColor: TTypographyProps['color'];
} {
  let displayString = 'Label.Inactive';
  let textColor: TTypographyProps['color'] = 'secondary';

  if (productStatus === ProductStatusType.Active) {
    displayString = 'Label.Active';
    textColor = 'success';
  } else if (productStatus === ProductStatusType.OffSale) {
    displayString = 'Label.OffSale';
    // keep secondary text color
  }

  return { displayString, textColor };
}

function ItemCardDeveloperSubscriptionsProductStatus({ productStatus, isLoading }: Props) {
  const { translate } = useTranslation();
  const { displayString, textColor } = decodeProductStatusType(productStatus);
  return (
    <Typography color={textColor} noWrap variant='body2'>
      {isLoading ? <Skeleton /> : translate(displayString)}
    </Typography>
  );
}

export default withTranslation(ItemCardDeveloperSubscriptionsProductStatus, [
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Creations,
]);
