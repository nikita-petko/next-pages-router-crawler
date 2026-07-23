import { useMemo } from 'react';
import type { RobloxItemConfigurationApiRentalOption } from '@rbx/client-itemconfiguration/v1';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Dialog,
  DialogContent,
  Grid,
  useTheme,
  DialogActions,
  Button,
  makeStyles,
  TableContainer,
} from '@rbx/ui';
import { NumberIcon } from '@modules/charts-generic/charts/numberFormatters';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  CellDataType,
  TableConfig,
} from '@modules/charts-generic/tables/types/GenericTableType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  DurationOptionsEnum,
  mapDurationToDays,
  mapDurationToString,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';

const useStyles = makeStyles()(() => ({
  subText: {
    marginTop: '10px',
    color: 'GrayText',
  },
}));

enum ColumnKey {
  Duration = 'duration',
  Price = 'price',
}

interface TimedOptionsDialogProps {
  showTimedOptionsDialog: boolean;
  setShowTimedOptionsDialog: (show: boolean) => void;
  rentalPricingData: RobloxItemConfigurationApiRentalOption[];
}

function TimedOptionsDialog(props: TimedOptionsDialogProps) {
  const { showTimedOptionsDialog, setShowTimedOptionsDialog, rentalPricingData } = props;
  const { classes } = useStyles();
  const { translate } = useTranslation();

  const theme = useTheme();

  const columnConfigs: TableColumnConfig<ColumnKey>[] = useMemo(
    () => [
      {
        columnKey: ColumnKey.Duration,
        columnType: ColumnType.Text,
        titleKey: { key: 'Title.Duration', namespace: TranslationNamespace.ConfigureItem },
        widthWeight: 1,
      },
      {
        columnKey: ColumnKey.Price,
        columnType: ColumnType.Number,
        titleKey: { key: 'Title.Price', namespace: TranslationNamespace.ConfigureItem },
        widthWeight: 1,
        analyticsNumberFormattingSpec: {
          abbreviate: false,
          numberFormatOptions: {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          },
          icon: NumberIcon.Robux,
        },
      },
    ],
    [],
  );

  const rowData: Map<ColumnKey, CellDataType>[] = useMemo(() => {
    function getPriceForDuration(duration: DurationOptionsEnum): string {
      // For permanent duration, rentalPrice.rentalDays is undefined from BE
      if (duration === DurationOptionsEnum.Permanent) {
        const permanentPrice = rentalPricingData.find(
          (rentalPrice) => rentalPrice.rentalDays === undefined,
        );
        return permanentPrice?.priceInRobux?.toString() ?? '';
      }

      // For other durations, match by rentalDays
      return (
        rentalPricingData
          .find((rentalPrice) => rentalPrice.rentalDays === mapDurationToDays(duration))
          ?.priceInRobux?.toString() ?? ''
      );
    }

    return Object.values(DurationOptionsEnum).map((duration) => {
      const map = new Map<ColumnKey, CellDataType>();

      // Duration column
      map.set(ColumnKey.Duration, {
        type: ColumnType.Text,
        value: `${translate(`Action.${mapDurationToString(duration)}`)}`,
      });

      map.set(ColumnKey.Price, {
        type: ColumnType.Number,
        value: parseFloat(getPriceForDuration(duration)),
      });

      return map;
    });
  }, [translate, rentalPricingData]);

  const tableConfig: TableConfig<ColumnKey> = useMemo(
    () => ({
      showHeader: true,
      showFooter: false,
      stickyHeader: false,
    }),
    [],
  );

  return (
    <Dialog onClose={() => setShowTimedOptionsDialog(false)} open={showTimedOptionsDialog}>
      <DialogContent style={{ width: '100%' }}>
        <div
          style={{
            padding: '0 10px 10px 10px',
            color: theme.palette.mode === 'light' ? 'black' : 'white',
          }}>
          <div style={{ textAlign: 'left' }}>
            <Grid container alignItems='left' direction='column'>
              <Typography variant='h3'>{translate('Title.TimedOptions')}</Typography>
              <Typography variant='body1' className={classes.subText}>
                {translate('Description.TimedOptionsDialog')}
              </Typography>
            </Grid>
            <br />
            <Grid container alignItems='left' direction='column'>
              <Typography variant='body1'>{translate('Label.HowAreThesePricesSet')}</Typography>
              <Typography variant='body1' className={classes.subText}>
                {translate('Description.HowAreThesePricesSet')}
              </Typography>
            </Grid>
            <br />
            <Grid container alignItems='left'>
              <TableContainer>
                <GenericTableV2
                  rowData={rowData}
                  columnConfigs={columnConfigs}
                  tableConfig={tableConfig}
                  isDataLoading={false}
                  isResponseFailed={false}
                  isUserForbidden={false}
                />
              </TableContainer>
            </Grid>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          variant='contained'
          size='large'
          color='secondary'
          onClick={() => {
            setShowTimedOptionsDialog(false);
          }}>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TimedOptionsDialog;
