import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Radio, RadioGroup } from '@rbx/foundation-ui';
import { useLocalization } from '@rbx/intl';
import { FormHelperText, UIThemeProvider } from '@rbx/ui';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import DateField from '@components/common/form/DateField';
import useReportDownloadStyles from '@components/reporting/ReportDownloadModal.styles';
import { TranslationNamespace } from '@constants/localization';
import {
  FileTypeText,
  ReportCreationStatus,
  ReportDownloadModel,
  ReportDownloadModelFieldNames,
  ReportTypeText,
} from '@constants/reportDownload';
import { REPORTING_TIMEZONE_DB_NAME } from '@constants/reportingStatsConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useResolvedThemeMode from '@hooks/useResolvedThemeMode';
import {
  createReportDownload,
  getReportCreationStatus,
  getReportDownloadUrl,
} from '@services/ads/reportDownloadService';
import { useAppStore } from '@stores/appStoreProvider';
import type { ReportDownloadFormValues } from '@type/reportDownload';
import { IsValidDate } from '@utils/date';
import { CaptureException } from '@utils/error';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import { PollWithRetryLimitAndCancelCallback } from '@utils/poll';
import { ConvertFormDataToCreateReportDownloadRequest } from '@utils/reportDownload';
import { GetTimezoneObjFromEnum } from '@utils/timezone';

interface ReportDownloadDialogProps extends BaseInjectedDialogProps {
  /**
   * `true` when launched from the new (lite_modules) reporting flow.
   * Threads through to backend telemetry + request params so we can tell
   * apart usage between the legacy classic page and the new dashboard.
   */
  isNewFlowType?: boolean;
  universeId?: number;
}

interface ReportDownloadDateFieldProps {
  dateInputLabel: string;
  dateInputName: ReportDownloadModelFieldNames.START_DATE | ReportDownloadModelFieldNames.END_DATE;
  form: UseFormReturn<ReportDownloadFormValues>;
  helperText?: string;
  onDateChangeCustom: (
    date: Date | null,
    inputName: ReportDownloadModelFieldNames.START_DATE | ReportDownloadModelFieldNames.END_DATE,
  ) => void;
  translateFn: (key: string) => string;
}

interface CancelPollingObj {
  cancelFn: () => void;
}

const validationSchema = z
  .object({
    [ReportDownloadModelFieldNames.END_DATE]: z.date().superRefine((val, ctx) => {
      if (!val) {
        ctx.addIssue({ code: 'custom', message: 'Validation.Required' });
        return;
      }
      if (!(val instanceof Date)) {
        ctx.addIssue({ code: 'custom', message: 'Validation.InvalidDate' });
      }
    }),
    [ReportDownloadModelFieldNames.FILE_TYPE]: z.enum(FileTypeText),
    [ReportDownloadModelFieldNames.REPORT_TYPE]: z.enum(ReportTypeText),
    [ReportDownloadModelFieldNames.START_DATE]: z.date().superRefine((val, ctx) => {
      if (!val) {
        ctx.addIssue({ code: 'custom', message: 'Validation.Required' });
        return;
      }
      if (!(val instanceof Date)) {
        ctx.addIssue({ code: 'custom', message: 'Validation.InvalidDate' });
      }
    }),
  })
  .refine(
    (data: ReportDownloadFormValues) => {
      const endDate = data[ReportDownloadModelFieldNames.END_DATE];
      const startDate = data[ReportDownloadModelFieldNames.START_DATE];
      return endDate > startDate;
    },
    {
      error: 'Validation.NeedsToBeAfterStartDate',
      path: [ReportDownloadModelFieldNames.END_DATE],
    },
  );

const ReportDownloadDateField = ({
  dateInputLabel,
  dateInputName,
  form,
  helperText,
  onDateChangeCustom,
  translateFn,
}: ReportDownloadDateFieldProps): ReactElement => {
  const { locale } = useLocalization();
  const errorMsg = form.formState.errors[dateInputName]?.message;
  // An invalid selection is written back to the form as-is so the resolver can
  // flag it, so the watched value is not necessarily a usable Date.
  const watchedDate = form.watch(dateInputName);

  return (
    <DateField
      dataTestId={dateInputName}
      direction='Past'
      error={
        form.formState.touchedFields[dateInputName] && errorMsg ? translateFn(errorMsg) : undefined
      }
      helperText={helperText}
      id={dateInputName}
      label={dateInputLabel}
      locale={locale}
      nextMonthLabel={translateFn('Label.NextMonth')}
      onChange={(date) => onDateChangeCustom(date, dateInputName)}
      previousMonthLabel={translateFn('Label.PreviousMonth')}
      value={IsValidDate(watchedDate) ? watchedDate : null}
    />
  );
};

const ReportDownloadDialog = ({
  isNewFlowType,
  onClose,
  setDismissible,
  universeId,
}: ReportDownloadDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const themeMode = useResolvedThemeMode();
  const {
    classes: {
      actionRow,
      datePickerGroupSpace,
      datePickerRow,
      dialogRow,
      fileTypeRow,
      infoRow,
      loadingStyle,
      reportTypeRow,
    },
    cx,
  } = useReportDownloadStyles();

  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  const [cancelPollingObj, setCancelPollingObj] = useState<CancelPollingObj>();
  const [errorWithDownload, setErrorWithDownload] = useState<string>('');

  const { organizationInfo } = useAppStore.getState().appData;
  const timezoneDbName = organizationInfo?.time_zone
    ? GetTimezoneObjFromEnum(organizationInfo.time_zone).timezoneDbName
    : undefined;
  const reportTimezoneDbName =
    universeId === undefined ? timezoneDbName : REPORTING_TIMEZONE_DB_NAME;
  const reportTimezoneLabel = universeId === undefined ? timezoneDbName : 'UTC';

  const getInitStartDate = (): Date => {
    const initStartDate = new Date();
    const currentMonth = initStartDate.getMonth();
    initStartDate.setMonth(currentMonth - 1);
    // If the current month has more days than previous month, and it's the
    // final date of the current month then previous month === current month.
    // We subtract 1 from the days to get the last day of the previous month.
    if (initStartDate.getMonth() === currentMonth) {
      initStartDate.setDate(0);
    }
    initStartDate.setHours(0, 0, 0, 0);
    return initStartDate;
  };

  const getInitEndDate = (): Date => {
    const initEndDate = new Date();
    initEndDate.setHours(0, 0, 0, 0);
    return initEndDate;
  };

  const tryDownloadReport = async (reportDownloadRequestId: string): Promise<boolean> => {
    try {
      const reportCreationStatusRes = await getReportCreationStatus(
        reportDownloadRequestId,
        universeId,
      );

      if (!reportCreationStatusRes?.reportCreationStatus) {
        throw new Error('undefined report creation status');
      }

      if (
        reportCreationStatusRes.reportCreationStatus ===
        ReportCreationStatus.REPORT_CREATION_STATUS_READY_TO_DOWNLOAD
      ) {
        const downloadReportUrl = await getReportDownloadUrl(reportDownloadRequestId, universeId);

        if (!downloadReportUrl?.reportPreSignedUrl) {
          return false;
        }
        window.location.assign(downloadReportUrl.reportPreSignedUrl);

        return true;
      }

      if (
        reportCreationStatusRes.reportCreationStatus ===
        ReportCreationStatus.REPORT_CREATION_STATUS_OUTDATED
      ) {
        throw new Error('report request became outdated');
      }

      return false;
    } catch (error) {
      CaptureException({
        error,
        message: 'error processing report download request',
      });

      cancelPollingObj?.cancelFn();
      setErrorWithDownload(translate('Message.ErrorOccurredTryAgain'));
      setDownloadLoading(false);
      setDismissible(true);

      return false;
    }
  };

  const successCallback = (): void => {
    setDownloadLoading(false);
    setDismissible(true);
    onClose();
  };

  const form = useForm<ReportDownloadFormValues>({
    defaultValues: {
      [ReportDownloadModelFieldNames.END_DATE]: getInitEndDate(),
      [ReportDownloadModelFieldNames.FILE_TYPE]: ReportDownloadModel.fileType
        .initValue as FileTypeText,
      [ReportDownloadModelFieldNames.REPORT_TYPE]: ReportDownloadModel.reportType
        .initValue as ReportTypeText,
      [ReportDownloadModelFieldNames.START_DATE]: getInitStartDate(),
    },
    mode: 'onChange',
    resolver: zodResolver(validationSchema),
  });

  const handleSubmit: SubmitHandler<ReportDownloadFormValues> = async (values) => {
    try {
      logNativeClickEvent(EventName.CSVDownloadButtonClicked, {
        adAccountId: GetLocalStorage(StorageKeys.AD_ACCOUNT_ID, ''),
        fileType: values[ReportDownloadModelFieldNames.FILE_TYPE].toString() || '',
        originatedFrom: isNewFlowType ? 'newflow' : '',
        reportEndDateMs:
          values[ReportDownloadModelFieldNames.END_DATE].getTime?.()?.toString() || '',
        reportStartDateMs:
          values[ReportDownloadModelFieldNames.START_DATE].getTime?.()?.toString() || '',
        reportType: values[ReportDownloadModelFieldNames.REPORT_TYPE].toString() || '',
      });
    } catch (e) {
      CaptureException(e as Error);
    }

    setDownloadLoading(true);
    setDismissible(false);
    setErrorWithDownload('');
    const createReportDownloadRequest = ConvertFormDataToCreateReportDownloadRequest({
      isNewFlowType,
      timezoneDbName: reportTimezoneDbName,
      values,
    });
    await createReportDownload(createReportDownloadRequest, universeId)
      .then((body) => {
        if (!body?.reportDownloadRequestId) {
          throw new Error('undefined report download request id');
        }
        setCancelPollingObj({
          cancelFn: PollWithRetryLimitAndCancelCallback({
            fn: (): Promise<boolean> => tryDownloadReport(body.reportDownloadRequestId as string),
            interval: 2000,
            maxRetries: 60,
            onCancelCb: () => {
              setDownloadLoading(false);
              setDismissible(true);
              CaptureException({ message: 'error downloading report - please try again' });
            },
            onMaxRetriesReached: (): void => {
              setDownloadLoading(false);
              setDismissible(true);
              CaptureException({ message: 'error downloading report - please try again' });
            },
            successCb: successCallback,
          }),
        });
      })
      .catch((error: Error) => {
        CaptureException({
          error,
          message: 'error creating report download request',
        });

        setErrorWithDownload(translate('Message.ErrorOccurredTryAgain'));
        setDownloadLoading(false);
        setDismissible(true);
      });
  };

  const handleDateChange = (
    newDate: Date | null,
    inputName: ReportDownloadModelFieldNames.START_DATE | ReportDownloadModelFieldNames.END_DATE,
  ): void => {
    if (!IsValidDate(newDate)) {
      form.setValue(inputName, newDate as Date, { shouldTouch: true, shouldValidate: true });
      form.setError(inputName, { message: translate('Validation.InvalidDate') });
      return;
    }

    form.setValue(inputName, newDate as Date, { shouldTouch: true, shouldValidate: true });
  };

  const dialogBody = downloadLoading ? (
    // UIThemeProvider is required for the inner @rbx/ui (MUI) components
    // (CenteredCircularProgress, FormHelperText). It wraps only the inner
    // @rbx/ui content so it doesn't nest a MUI Modal focus trap inside
    // Foundation-UI's <Dialog> (which would cause an infinite focus-event
    // loop). The mode has to be passed explicitly because a bare provider
    // defaults to dark, overriding the theme the app root established.
    <UIThemeProvider theme={themeMode}>
      <div className={loadingStyle}>
        <CenteredCircularProgress />
        <span className='text-heading-small'>{translate('Description.ReportBeingPrepared')}</span>
      </div>
    </UIThemeProvider>
  ) : (
    <UIThemeProvider theme={themeMode}>
      <div>
        <div className={infoRow}>
          <span className='text-body-medium content-default'>
            {translate('Description.DownloadExportsAllData')}
          </span>
        </div>
        <div className={cx(dialogRow, datePickerRow)}>
          <ReportDownloadDateField
            dateInputLabel={translate(ReportDownloadModel.startDate.label)}
            dateInputName={ReportDownloadModelFieldNames.START_DATE}
            form={form}
            helperText={
              reportTimezoneLabel
                ? translate('Label.TimezoneValue', { timezone: reportTimezoneLabel })
                : ''
            }
            onDateChangeCustom={handleDateChange}
            translateFn={translate}
          />
          <div className={datePickerGroupSpace} />
          <ReportDownloadDateField
            dateInputLabel={translate(ReportDownloadModel.endDate.label)}
            dateInputName={ReportDownloadModelFieldNames.END_DATE}
            form={form}
            helperText=' '
            onDateChangeCustom={handleDateChange}
            translateFn={translate}
          />
        </div>
        <span className='text-title-large'>{translate('Label.ReportType')}</span>
        <div className={cx(dialogRow, reportTypeRow)}>
          <RadioGroup
            onValueChange={(v) =>
              form.setValue(ReportDownloadModelFieldNames.REPORT_TYPE, v as ReportTypeText)
            }
            value={form.watch(ReportDownloadModelFieldNames.REPORT_TYPE)}>
            <div className='flex flex-row gap-large'>
              <Radio
                id={ReportDownloadModel.reportType.totalAggregate.name}
                label={translate(ReportDownloadModel.reportType.totalAggregate.label)}
                value={ReportDownloadModel.reportType.totalAggregate.value as ReportTypeText}
              />
              <Radio
                id={ReportDownloadModel.reportType.dailyAggregate.name}
                label={translate(ReportDownloadModel.reportType.dailyAggregate.label)}
                value={ReportDownloadModel.reportType.dailyAggregate.value as ReportTypeText}
              />
            </div>
          </RadioGroup>
        </div>
        <div>
          <span className='text-title-large'>{translate('Label.FileType')}</span>
          <div className={`${dialogRow} ${fileTypeRow}`}>
            <RadioGroup
              onValueChange={(v) =>
                form.setValue(ReportDownloadModelFieldNames.FILE_TYPE, v as FileTypeText)
              }
              value={form.watch(ReportDownloadModelFieldNames.FILE_TYPE)}>
              <div className='flex flex-row gap-large'>
                <Radio
                  id={ReportDownloadModel.fileType.csv.name}
                  label={translate(ReportDownloadModel.fileType.csv.label)}
                  value={ReportDownloadModel.fileType.csv.value as FileTypeText}
                />
                <Radio
                  id={ReportDownloadModel.fileType.excel.name}
                  label={translate(ReportDownloadModel.fileType.excel.label)}
                  value={ReportDownloadModel.fileType.excel.value as FileTypeText}
                />
              </div>
            </RadioGroup>
          </div>
        </div>
        {errorWithDownload && (
          <div className={cx(dialogRow, actionRow)} data-testid='error-with-download'>
            <FormHelperText error>{errorWithDownload}</FormHelperText>
          </div>
        )}
      </div>
    </UIThemeProvider>
  );

  return (
    <BaseDialog
      dialogBody={dialogBody}
      dialogFooter={
        <>
          <Button
            data-testid='download-button'
            isDisabled={downloadLoading || !form.formState.isValid}
            isLoading={downloadLoading}
            onClick={form.handleSubmit(handleSubmit)}
            size='Medium'
            variant='Emphasis'>
            {translate('Action.Download')}
          </Button>
          <Button isDisabled={downloadLoading} onClick={onClose} size='Medium' variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        </>
      }
      dialogTitle={translate('Heading.DownloadSetting')}
    />
  );
};

/**
 * Imperative trigger for the report-download dialog.
 *
 * The dialog opens with `hasCloseAffordance: true` so the Foundation Dialog
 * renders its own X in the top-right; we don't need to hand-roll one in the
 * body the way the legacy modal did.
 */
export const openReportDownloadDialog = (
  params: { isNewFlowType?: boolean; universeId?: number } = {},
): void => {
  openDialog({
    component: ReportDownloadDialog,
    options: { hasCloseAffordance: true, size: 'Large' },
    props: params,
  });
};

export default ReportDownloadDialog;
