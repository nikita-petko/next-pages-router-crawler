import React from 'react';
import { makeStyles } from '@rbx/ui';
import { withTranslation } from '@rbx/intl';
import { components } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Section from '../common/Section';
import { beginnerToolData } from '../../constants/beginnerToolsConstants';
import BeginnerToolCard from './BeginnerToolCard';

const { Flex } = components;

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
