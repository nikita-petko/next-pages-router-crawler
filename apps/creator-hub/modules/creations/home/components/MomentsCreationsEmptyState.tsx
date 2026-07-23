import { useTranslation } from '@rbx/intl';
import { Button, Link } from '@rbx/ui';
import { MOMENTS_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';

type MomentsCreationsEmptyStateProps = {
  onCreateClick?: () => void;
};

const MomentsCreationsEmptyState = ({ onCreateClick }: MomentsCreationsEmptyStateProps) => {
  const { translate } = useTranslation();

  return (
    <EmptyState
      title={translate('Heading.ReachPlayersDirectlyInMoments')}
      size='large'
      illustration='videos'
      description={
        <>
          {translate('Description.UploadExternalVideosToMoments')}{' '}
          <Link
            aria-label={translate('Label.LearnMore')}
            color='inherit'
            href={MOMENTS_LEARN_MORE_URL}
            target='_blank'
            underline='always'>
            {translate('Label.LearnMore')}
          </Link>
        </>
      }>
      <Button
        variant='contained'
        size='large'
        fullWidth={false}
        type='button'
        onClick={onCreateClick}>
        {translate('Action.CreateMoments')}
      </Button>
    </EmptyState>
  );
};

export default MomentsCreationsEmptyState;
