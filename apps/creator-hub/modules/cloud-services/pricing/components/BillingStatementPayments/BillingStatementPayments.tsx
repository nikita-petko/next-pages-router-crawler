import type { FunctionComponent } from 'react';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  ArrowUpwardIcon,
  HourglassEmptyIcon,
  ArrowDownwardIcon,
  Label,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { currencyMoneyFormatter, dateFormatter } from '../../../utils/formatters';
import type { Payment } from '../../types';
import { TransactionStatus } from '../../types';
import useBillingStatementPaymentsStyles from './BillingStatementPayments.styles';

export type BillingStatementPaymentsProps = {
  payments: Payment[];
};

const BillingStatementPayments: FunctionComponent<BillingStatementPaymentsProps> = ({
  payments,
}) => {
  const { locale } = useLocalization();
  const {
    classes: { sectionTitle, tableContainer, transactionLabel, amountRow, typeRow },
  } = useBillingStatementPaymentsStyles();
  const { translate } = useTranslationWrapper(useTranslation());

  // Payments can have 4 transaction statuses. Success and Pending have their own labels. Invalid and Failed share the same label.
  const renderTransactionStatus = (status: TransactionStatus) => {
    if (status === TransactionStatus.Successful) {
      return (
        <Label
          labelText={translate(
            translationKey('Label.SuccessLabel', TranslationNamespace.CloudServices),
          )}
          severity='success'
          variant='contained'
          icon={<ArrowUpwardIcon />}
        />
      );
    }
    if (status === TransactionStatus.Pending) {
      return (
        <Label
          labelText={translate(
            translationKey('Label.PendingLabel', TranslationNamespace.CloudServices),
          )}
          severity='info'
          variant='contained'
          icon={<HourglassEmptyIcon />}
        />
      );
    }
    return (
      <Label
        icon={<ArrowDownwardIcon />}
        labelText={translate(
          translationKey('Label.FailedLabel', TranslationNamespace.CloudServices),
        )}
        severity='error'
        variant='contained'
      />
    );
  };

  return (
    <Grid item XSmall={12}>
      <Typography variant='h5' className={sectionTitle}>
        {translate(translationKey('Label.Transactions', TranslationNamespace.CloudServices))}
      </Typography>
      <TableContainer className={tableContainer}>
        <Table padding='normal' size='medium'>
          <TableHead>
            <TableRow>
              <TableCell align='left'>
                {translate(translationKey('Label.Date', TranslationNamespace.CloudServices))}
              </TableCell>
              <TableCell align='center'>
                {translate(translationKey('Label.Type', TranslationNamespace.CloudServices))}
              </TableCell>
              <TableCell className={amountRow} align='left'>
                {translate(translationKey('Label.Amount', TranslationNamespace.CloudServices))}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.timestamp}>
                <TableCell align='left'>
                  {dateFormatter(new Date(payment.timestamp), locale)}
                </TableCell>
                <TableCell align='center'>
                  <span className={typeRow}>
                    {translate(
                      translationKey('Label.PaymentType', TranslationNamespace.CloudServices),
                    )}
                  </span>
                </TableCell>
                <TableCell className={amountRow} align='left'>
                  {renderTransactionStatus(payment.status as TransactionStatus)}
                  <span
                    className={
                      transactionLabel
                    }>{`-${currencyMoneyFormatter(payment.amount)}`}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );
};

export default withTranslation(BillingStatementPayments, [TranslationNamespace.CloudServices]);
