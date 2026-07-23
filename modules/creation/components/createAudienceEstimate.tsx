import { makeStyles, Typography } from '@rbx/ui';

import CenteredCircularProgress from '@components/common/CenteredCircularProgress';

export const enum AudienceEstimateEnum {
  Audience_Estimate_Loading,
  Audience_Estimate_Error,
  Audience_Estimate_Present,
  Audience_Estimate_Undefined,
}

export interface AudienceEstimateType {
  estimateLowerBound: number;
  estimateNum: number;
  estimateStatus: AudienceEstimateEnum;
  estimateUpperBound: number;
  showAudienceGenreDisclaimer: boolean;
}

export const CreateAudienceEstimate = ({ estimate }: { estimate: AudienceEstimateType }) => {
  const {
    classes: { inner_block, loader, middle_text, outer_block, targetAudienceBlock },
  } = makeStyles()((theme) => ({
    inner_block: {
      color: 'white',
    },

    loader: {
      paddingTop: '16px',
    },

    middle_text: {
      color: 'white',
    },

    outer_block: {
      background: theme.palette.surface[200],
      padding: '32px',
      width: '383px',
    },

    targetAudienceBlock: {
      marginBottom: '16px',
      marginTop: '16px',
    },
  }))();

  const estimateString = (est: number, lowerBound: number, upperBound: number) => {
    const formatter = Intl.NumberFormat('en', {
      maximumSignificantDigits: 2,
      notation: 'compact',
    }); // this would need to change based on language
    let retStr = '';
    if (lowerBound > 0 && upperBound > 0 && (est === undefined || est <= 0)) {
      if (lowerBound < 1000) {
        retStr = 'Not Applicable';
      } else {
        retStr = `${formatter.format(lowerBound)} - ${formatter.format(upperBound)}`;
      }
    } else if (est < 1000) {
      retStr = 'Not Applicable';
    } else {
      retStr = `${formatter.format(est)}`;
    }
    return (
      <div>
        <Typography variant='h2'>{retStr}</Typography>
      </div>
    );
  };

  const render_inside = () => {
    switch (estimate.estimateStatus) {
      case AudienceEstimateEnum.Audience_Estimate_Loading:
        return (
          <div className={middle_text}>
            <div className={loader}>
              <CenteredCircularProgress />
              <Typography variant='body1'>We are fetching data</Typography>
            </div>
          </div>
        );
      case AudienceEstimateEnum.Audience_Estimate_Present:
        return estimateString(
          estimate.estimateNum,
          estimate.estimateLowerBound,
          estimate.estimateUpperBound,
        );
      default:
        return (
          <div>
            <Typography variant='h2'>Unavailable</Typography>
          </div>
        );
    }
  };

  const audienceGenreDislaimer = (
    <>
      <br />
      <br />
      Currently, the estimated audience size includes all audience genres. Specific genre selections
      will be reflected in the estimates after one month of data collection.
    </>
  );

  return (
    <div className={outer_block}>
      <div className={inner_block}>
        <div>
          <Typography variant='h4'>Estimated Monthly</Typography>
        </div>
        <div className={targetAudienceBlock}>
          <div>
            <Typography variant='h6'>Target Audience Size</Typography>
          </div>
          {render_inside()}
        </div>
        <div>
          <Typography variant='body2'>
            The approximate number of Roblox user Accounts your Ad could potentially reach over a
            month, with maximum budget and bids. Target Audience size is based on historical data
            for your selected targeting parameters and placements.
            {estimate.showAudienceGenreDisclaimer && audienceGenreDislaimer}
          </Typography>
        </div>
      </div>
    </div>
  );
};
