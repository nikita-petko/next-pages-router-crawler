import { AgreementCandidateType } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Button, makeStyles, Tooltip } from '@rbx/ui';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';

const useStyles = makeStyles()((theme) => ({
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(1),
  },
}));

type NoMatchesWithFiltersContentProps =
  | {
      candidateType: typeof AgreementCandidateType.Universe;
      onResetFilters: () => void;
      openDialog?: () => void;
      maxLimit: number;
    }
  | {
      candidateType: typeof AgreementCandidateType.Collectible;
      onResetFilters: () => void;
    };

const NoMatchesWithFiltersContent = (props: NoMatchesWithFiltersContentProps) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const isExperienceContent = props.candidateType === AgreementCandidateType.Universe;

  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Heading.NoMatchResultsYet')}
        size='small'
        description={translate(
          isExperienceContent
            ? 'Description.NoMatchesFoundWithFiltersManualScan'
            : 'Description.NoMatchesFoundWithFilters',
        )}
        illustration={isExperienceContent ? 'experiences' : 'avatarItem'}>
        <div className={classes.buttonContainer}>
          <Button onClick={props.onResetFilters} color='primaryBrand' variant='contained'>
            {translate('Action.ResetFilters')}
          </Button>
          {isExperienceContent && (
            <Tooltip
              title={translate('Label.DailyLimitReached', {
                maxLimit: props.maxLimit.toString(),
              })}
              arrow
              placement='bottom'
              disableHoverListener={!!props.openDialog}
              disableFocusListener={!!props.openDialog}
              disableTouchListener={!!props.openDialog}>
              <div>
                <Button
                  size='medium'
                  variant='contained'
                  color='secondary'
                  onClick={props.openDialog}
                  disabled={!props.openDialog}>
                  {translate('Action.RequestMatch')}
                </Button>
              </div>
            </Tooltip>
          )}
        </div>
      </EmptyState>
    </EmptyStateBorder>
  );
};

export default NoMatchesWithFiltersContent;
