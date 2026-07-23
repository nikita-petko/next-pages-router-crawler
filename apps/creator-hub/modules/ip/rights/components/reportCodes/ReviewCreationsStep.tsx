import type { FunctionComponent } from 'react';
import type { SnapshotContent } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import type { Doc } from '@modules/miscellaneous/components/uploaders/components/MultiDocumentUploader/MultiDocumentUploader';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { OriginalContent } from '../../helpers/parseOriginalContent';
import { usePagination } from '../../hooks/usePagination';
import ApplyFooter from '../registration/ApplyFooter';
import SnapshotCreationsTable from './SnapshotCreationsTable';

export interface ReviewCreationsStepProps {
  cartItems: SnapshotContent[];
  rootPlaceId?: number;
  originalContent: OriginalContent | null;
  description: string;
  documents: Doc[];
  enableClaimsAndDisputes: boolean;
  onDelete: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const ReviewCreationsStep: FunctionComponent<ReviewCreationsStepProps> = ({
  cartItems,
  rootPlaceId,
  originalContent,
  description,
  documents,
  enableClaimsAndDisputes,
  onDelete,
  onNext,
  onBack,
}) => {
  const { ready, translate } = useTranslation();
  const pagination = usePagination();

  if (!ready) {
    return null;
  }

  return (
    <Grid container direction='column' width='100%' spacing={2}>
      <Grid item>
        <Typography variant='h5' component='h2'>
          {translate('Label.CreationsYoureReporting')}
        </Typography>
      </Grid>
      <Grid item>
        <SnapshotCreationsTable
          items={cartItems}
          rootPlaceId={rootPlaceId}
          originalContent={originalContent}
          description={description}
          documents={documents}
          isClaim={enableClaimsAndDisputes}
          onDelete={onDelete}
          pagination={pagination}
        />
      </Grid>
      <Grid item>
        <ApplyFooter
          primaryLabel={translate('Label.Next')}
          primaryEnabled={(rootPlaceId != null && rootPlaceId > 0) || cartItems.length > 0}
          secondaryLabel={translate('Label.Back')}
          onNext={onNext}
          onBack={onBack}
        />
      </Grid>
    </Grid>
  );
};

export default withTranslation(ReviewCreationsStep, [TranslationNamespace.RightsPortal]);
