import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  CircularProgress,
  DatePicker,
  Grid,
  MenuItem,
  PickersUtilsProvider,
  TextField,
  Select,
} from '@rbx/ui';
import { useGetProductsBySeller } from '@modules/react-query/fiatPaidAccess/fiatPaidAccessQueries';
import EmptyResultsCard from '../../../components/EmptyResultsCard/EmptyResultsCard';
import { maxDropdownLimit } from '../../constants/PaginationConstants';
import type { PaidAccessProduct } from '../../constants/PaidAccessProductType';
import ExperienceThumbnail from '../ExperienceThumbnail/ExperienceThumbnail';
import PaidAccessTransactionsTable from '../PaidAccessTransactionsTable/PaidAccessTransactionsTable';
import usePaidAccessTransactionsStyles from './PaidAccessTransactions.styles';

interface PaidAccessTransactionsProps {
  groupId?: number;
}

const PaidAccessTransactions = ({ groupId }: PaidAccessTransactionsProps) => {
  const { ready: areTranslationsReady, translate } = useTranslation();
  const { classes } = usePaidAccessTransactionsStyles();

  const [selectedProduct, setSelectedProduct] = useState<PaidAccessProduct | null>(null);

  const maxEndDate = useMemo(() => new Date(Date.now()), []);
  const minStartDate = useMemo(() => new Date('10/01/2024'), []);

  const [displayStartDate, setDisplayStartDate] = useState<Date | null>(null);
  const [displayEndDate, setDisplayEndDate] = useState<Date | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const onChangeDisplayEndDate = useCallback(
    async (date: Date | null) => {
      date?.setHours(23, 59, 59);
      setDisplayEndDate(date);
      if (date === null) {
        setEndDate(date);
      } else if (
        (startDate === null && date >= minStartDate) ||
        (startDate !== null && date >= startDate)
      ) {
        if (date <= maxEndDate) {
          date?.setHours(23, 59, 59);
          setEndDate(date);
        } else {
          setEndDate(null);
        }
      }
    },
    [startDate, maxEndDate, minStartDate],
  );

  const onChangeDisplayStartDate = useCallback(
    async (date: Date | null) => {
      setDisplayStartDate(date);
      if (date === null) {
        setStartDate(date);
      } else if (
        (endDate === null && date <= maxEndDate) ||
        (endDate !== null && date <= endDate)
      ) {
        if (date >= minStartDate) {
          setStartDate(date);
        }
      }
    },
    [endDate, maxEndDate, minStartDate],
  );

  const { data: productsBySellerResponse, isLoading: isLoadingProducts } = useGetProductsBySeller(
    // Select component does not support pagination/infinite scroll currently so use overestimate for limit.
    maxDropdownLimit,
    groupId,
  );

  const paidAccessProducts: PaidAccessProduct[] = (productsBySellerResponse?.products ?? [])
    .filter(
      (product): product is { rootPlaceId: number; productName: string } =>
        product.rootPlaceId !== undefined && product.productName !== undefined,
    )
    .map((product) => ({
      rootPlaceId: product.rootPlaceId,
      productName: product.productName,
    }));

  const paidAccessProductOptions = paidAccessProducts.map((product) => ({
    ...product,
    thumbnail: <ExperienceThumbnail targetProduct={product} />,
  }));

  const onClickReset = useCallback(async () => {
    onChangeDisplayStartDate(null);
    onChangeDisplayEndDate(null);
    setSelectedProduct(null);
  }, [onChangeDisplayEndDate, onChangeDisplayStartDate]);

  const onChangeProduct = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      const productName = event.target.value as string;
      const product = paidAccessProductOptions.find((p) => p.productName === productName) || null;
      setSelectedProduct(product);
    },
    [paidAccessProductOptions],
  );

  const isLoading = !areTranslationsReady || isLoadingProducts;

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Grid container direction='column' alignItems='flex-start' spacing={2}>
      <Grid container item direction='row' justifyContent='start' spacing={2}>
        <Grid item>
          <Select
            size='medium'
            label={translate('Label.Experience')}
            onChange={onChangeProduct}
            value={selectedProduct?.productName || ''}
            SelectProps={{
              MenuProps: {
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                PaperProps: {
                  className: classes.dropdownMenu,
                },
              },
            }}
            className={classes.experienceDropdown}>
            {[...paidAccessProductOptions].map(({ productName, thumbnail }) => (
              <MenuItem key={productName} value={productName}>
                <div className={classes.dropdownItem}>
                  <div className={classes.thumbnailContainer}>{thumbnail}</div>
                  <div>{productName}</div>
                </div>
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item>
          <PickersUtilsProvider>
            <DatePicker
              maxDate={displayEndDate || maxEndDate}
              minDate={minStartDate}
              onChange={onChangeDisplayStartDate}
              renderInput={(params) => (
                <TextField
                  {...params}
                  value={displayStartDate}
                  id='start-date-picker'
                  data-testid='startDate'
                  variant='outlined'
                  label={translate('Label.StartDate')}
                />
              )}
              value={displayStartDate}
            />
          </PickersUtilsProvider>
        </Grid>
        <Grid item>
          <PickersUtilsProvider>
            <DatePicker
              maxDate={maxEndDate}
              minDate={displayStartDate || minStartDate}
              onChange={onChangeDisplayEndDate}
              renderInput={(params) => (
                <TextField
                  {...params}
                  value={displayEndDate}
                  id='end-date-picker'
                  data-testid='endDate'
                  variant='outlined'
                  label={translate('Label.EndDate')}
                />
              )}
              value={displayEndDate}
            />
          </PickersUtilsProvider>
        </Grid>
        <Grid item className={classes.gridActionItem}>
          <Button onClick={onClickReset}>{translate('Action.Reset')}</Button>
        </Grid>
      </Grid>
      <Grid item className={classes.fullWidth}>
        {paidAccessProductOptions && selectedProduct ? (
          <PaidAccessTransactionsTable
            product={selectedProduct}
            startDate={startDate || undefined}
            endDate={endDate || undefined}
          />
        ) : (
          <EmptyResultsCard />
        )}
      </Grid>
    </Grid>
  );
};

export default PaidAccessTransactions;
