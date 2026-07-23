import { FlowTypes } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';

const HeaderTitleKey = {
  [FlowTypes.CLONE]: 'Heading.DuplicateCampaign',
  [FlowTypes.CREATE]: 'Heading.CreateCampaign',
  [FlowTypes.EDIT]: 'Heading.EditCampaign',
};

const Header = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const title = useCampaignBuilderStore(({ flowType }) =>
    translate(HeaderTitleKey[flowType ?? FlowTypes.CREATE]),
  );

  return (
    <div data-testid='titleContainer'>
      <span className='text-heading-large'>{title}</span>
    </div>
  );
};

export default Header;
