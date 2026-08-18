import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { TakedownRequest } from '../../types/types';

export enum ReportType {
  CopyrightInfringement = 'COPYRIGHT_INFRINGEMENT',
  TrademarkInfringement = 'TRADEMARK_INFRINGEMENT',
}

interface ReportTypeSectionProps {
  reportType: ReportType;
  setReportType: (reportType: ReportType) => void;
  takedownRequests: Array<TakedownRequest>;
}

/**
 * ReportTypeSection lets the user pick the type of report (copyright vs. trademark
 * infringement) for a removal request. Once at least one creation has been added
 * to the request, the report type can no longer be changed.
 */
const ReportTypeSection = ({
  reportType,
  setReportType,
  takedownRequests,
}: ReportTypeSectionProps) => {
  const { translate } = useTranslation();
  const isDisabled = takedownRequests.length > 0;

  return (
    <div className='padding-bottom-large'>
      <h2 className='text-heading-small content-emphasis padding-bottom-large margin-none'>
        {translate('Heading.ReportType')}
      </h2>
      <div className='padding-y-small'>
        <RadioGroup
          value={reportType}
          isDisabled={isDisabled}
          onValueChange={(value) => {
            if (isValidEnumValue(ReportType, value)) {
              setReportType(value);
            }
          }}>
          <Radio
            value={ReportType.CopyrightInfringement}
            label={translate('Label.CopyrightInfringement')}
            size='Large'
            isDisabled={isDisabled}
          />
          <Radio
            value={ReportType.TrademarkInfringement}
            label={translate('Label.TrademarkInfringement')}
            size='Large'
            isDisabled={isDisabled}
          />
        </RadioGroup>
      </div>
    </div>
  );
};

export default withTranslation(ReportTypeSection, [TranslationNamespace.RightsPortal]);
