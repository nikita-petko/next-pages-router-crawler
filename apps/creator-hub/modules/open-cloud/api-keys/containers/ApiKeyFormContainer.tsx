import type { SearchCreatorType } from '@rbx/client-universes-api/v1';
import CreateApiKeyForm from '../components/v1/CreateApiKeyForm';
import EditApiKeyForm from '../components/v1/EditApiKeyForm';
import FormMode from '../enums/FormMode';
import type FormModeState from '../interfaces/FormModeState';
import ScopesFormProvider from '../providers/ScopesFormProvider';
import useApiKeyFormContainerStyles from './ApiKeyFormContainer.styles';

interface ApiKeyFormContainerProps {
  className: string;
  formMode: FormModeState;
  creatorType: SearchCreatorType;
  creatorTargetId?: number;
  compact: boolean;
  onHideForm: () => void;
}

const ApiKeyFormContainer = ({
  formMode,
  creatorType,
  creatorTargetId,
  compact,
  onHideForm,
  className,
}: ApiKeyFormContainerProps) => {
  const {
    classes: { section },
  } = useApiKeyFormContainerStyles();
  let formComponent;

  if (formMode.mode === FormMode.Create) {
    formComponent = (
      <CreateApiKeyForm
        creatorType={creatorType}
        creatorTargetId={creatorTargetId}
        className={section}
        compact={compact}
        onHideForm={onHideForm}
      />
    );
  } else if (formMode.mode === FormMode.Edit) {
    formComponent = (
      <EditApiKeyForm
        creatorType={creatorType}
        creatorTargetId={creatorTargetId}
        className={section}
        compact={compact}
        id={formMode.id}
        onHideForm={onHideForm}
      />
    );
  } else if (formMode.mode === FormMode.Duplicate) {
    formComponent = (
      <CreateApiKeyForm
        creatorType={creatorType}
        creatorTargetId={creatorTargetId}
        className={section}
        compact={compact}
        id={formMode.id}
        onHideForm={onHideForm}
      />
    );
  }

  return (
    <div className={className}>
      <ScopesFormProvider>{formComponent}</ScopesFormProvider>
    </div>
  );
};

export default ApiKeyFormContainer;
