import type { FC, ReactNode } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import {
  CircularProgress,
  Grid,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKeyWithoutNamespace } from '@modules/analytics-translations/wrapperFunctions';
import { EmptyGrid } from '@modules/miscellaneous/components';
import type { GenericChartState } from '../charts/types/ChartTypes';
import useGenericTableBodyWrapperStyles from './GenericTableBodyWrapper.styles';

type GenericTableBodyWrapperProps = GenericChartState & {
  columns?: number; // used to determine colSpan when showing status
  showNoDataMessage?: boolean;
  isV2?: boolean;
  emptyStateTableHeight?: number;
};

// NOTE(shumingxu, 11/08/2023): See https://stackoverflow.com/questions/398734/colspan-all-columns
// Seems like there is no good way of spanning the entire table other than having a number larger
// than the number of columns. This should work unless there is a table with >100 columns.
// We use TableRow with colSpan as opposed to a manual-width-styled element to preserve table styling consistency.
const spanAllColumns = 100;

const GenericTableBodyWrapper: FC<React.PropsWithChildren<GenericTableBodyWrapperProps>> = ({
  children,
  columns = spanAllColumns,
  isDataLoading,
  isUserForbidden,
  isResponseFailed,
  showNoDataMessage,
  isV2,
  emptyStateTableHeight,
}) => {
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { emptyState },
  } = useGenericTableBodyWrapperStyles({ emptyStateTableHeight });
  const wrapped = (body: ReactNode) => {
    if (isCompactView && isV2) {
      return (
        <Grid container item XSmall={12} data-testid='table-container' component='tbody'>
          {body}
        </Grid>
      );
    }
    return <TableBody>{body}</TableBody>;
  };

  const emptyTable = (body: ReactNode) => {
    if (isCompactView && isV2) {
      return wrapped(<EmptyGrid>{body}</EmptyGrid>);
    }
    return wrapped(
      <TableRow className={emptyState}>
        <TableCell colSpan={columns}>
          <EmptyGrid>{body}</EmptyGrid>
        </TableCell>
      </TableRow>,
    );
  };

  if (isDataLoading) {
    return emptyTable(<CircularProgress color='secondary' data-testid='loadingIndicator' />);
  }
  if (isUserForbidden) {
    return emptyTable(
      <Typography>
        {translate(translationKeyWithoutNamespace('Message.UserHasNoPermission'))}
      </Typography>,
    );
  }
  if (isResponseFailed) {
    return emptyTable(
      <Typography>
        {translate(translationKeyWithoutNamespace('Message.RequestFailure'))}
      </Typography>,
    );
  }
  if (showNoDataMessage) {
    return emptyTable(
      <Typography>{translate(translationKeyWithoutNamespace('Message.NoDataReturn'))}</Typography>,
    );
  }
  return wrapped(children);
};

export default GenericTableBodyWrapper;
