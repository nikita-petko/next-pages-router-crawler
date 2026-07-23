import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey } from '@modules/analytics-translations';
import useRoundedTableStyles from './common/roundedTable.styles';
import useExperienceSubscriptionsTableStyles from './ExperienceSubscriptionsTable.styles';

function SubscriptionsTableBase({ children }: React.PropsWithChildren) {
  const { classes: rounded } = useRoundedTableStyles();
  const { classes } = useExperienceSubscriptionsTableStyles();
  const { translate } = useTranslation();

  return (
    <TableContainer className={classes.tableContainer}>
      <Table className={rounded.table}>
        <TableHead>
          <TableRow>
            <TableCell className={classes.nameCell}>
              {translate(
                translationKey(
                  'Label.SubscriptionName',
                  TranslationNamespace.ExperienceSubscriptions,
                ).key,
              )}
            </TableCell>

            <TableCell className={classes.statusCell}>
              {translate(
                translationKey('Label.CurrentStatus', TranslationNamespace.ExperienceSubscriptions)
                  .key,
              )}
            </TableCell>

            <TableCell className={classes.idCell}>
              {translate(
                translationKey('Label.SubscriptionID', TranslationNamespace.ExperienceSubscriptions)
                  .key,
              )}
            </TableCell>

            <TableCell className={classes.priceCell}>
              {translate(
                translationKey('Label.Price', TranslationNamespace.ExperienceSubscriptions).key,
              )}
            </TableCell>

            <TableCell className={classes.regionalPricingCell}>
              {translate(
                translationKey('Label.RegionalPricing', TranslationNamespace.Creations).key,
              )}
            </TableCell>

            <TableCell className={classes.actionsCell} padding='checkbox' />
          </TableRow>
        </TableHead>

        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}

export default memo(SubscriptionsTableBase);
