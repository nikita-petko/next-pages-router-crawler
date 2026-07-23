import { withTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { beginnerToolData } from '../../constants/beginnerToolsConstants';
import Section from '../common/Section';
import BeginnerToolCard from './BeginnerToolCard';

const useStyles = makeStyles()(() => ({
  root: {
    width: '100%',
    gap: '16px',
    flexWrap: 'wrap',
  },
}));

function BeginnerTools() {
  const {
    classes: { root },
  } = useStyles();

  return (
    <Section>
      <Flex classes={{ root }} alignItems='stretch' justifyContent='center'>
        {beginnerToolData.map((data) => (
          <BeginnerToolCard key={data.id} {...data} />
        ))}
      </Flex>
    </Section>
  );
}

export default withTranslation(BeginnerTools, [TranslationNamespace.Home]);
