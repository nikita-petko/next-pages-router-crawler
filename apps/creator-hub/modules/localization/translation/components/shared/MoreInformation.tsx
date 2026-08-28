import type { FunctionComponent } from 'react';
import React from 'react';
import type { TTranslationKey } from '@rbx/intl';
import { useTranslation } from '@rbx/intl';
import { Typography, Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Panel from '../../../common/components/Panel';
import useMoreInformationStyles from './MoreInformation.styles';

interface Field {
  label: string;
  value: string;
}

export interface MoreInformationProps {
  translationContext?: string | null;
  translationExample?: string | null;
  translationKey?: string | null;
  translationLocation?: string | null;
}

const MoreInformation: FunctionComponent<React.PropsWithChildren<MoreInformationProps>> = ({
  translationContext,
  translationExample,
  translationKey,
  translationLocation,
}) => {
  const {
    classes: { container, title, margins, text },
  } = useMoreInformationStyles();
  const { translateWithNamespace } = useTranslation();

  const translate = (key: string): string =>
    translateWithNamespace(
      TranslationNamespace.GameStringTranslation,
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      key as TTranslationKey<typeof TranslationNamespace.GameStringTranslation>,
    );

  const fields: Field[] = [];
  if (translationContext !== undefined) {
    fields.push({
      label: translate('Label.Context'),
      // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional boolean OR: falsy (incl. empty string) falls back to the default message
      value: translationContext || translate('Message.DefaultContext'),
    });
  }
  if (translationExample !== undefined) {
    fields.push({
      label: translate('Label.Example'),
      // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional boolean OR: falsy (incl. empty string) falls back to the default message
      value: translationExample || translate('Message.DefaultExample'),
    });
  }
  if (translationKey !== undefined) {
    fields.push({
      label: translate('Label.Key'),
      // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional boolean OR: falsy (incl. empty string) falls back to the default message
      value: translationKey || translate('Message.DefaultKey'),
    });
  }
  if (translationLocation !== undefined) {
    fields.push({
      label: translate('Label.Location'),
      // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional boolean OR: falsy (incl. empty string) falls back to the default message
      value: translationLocation || translate('Message.DefaultLocation'),
    });
  }

  return (
    <Panel className={container} title={translate('Title.MoreInformation')}>
      {fields.map((field) => (
        <Grid className={margins} key={field.label}>
          <Typography className={title} display='inline' variant='largeLabel1'>
            {field.label}:
          </Typography>
          <Typography className={text} display='inline' variant='largeLabel2'>
            {field.value}
          </Typography>
        </Grid>
      ))}
    </Panel>
  );
};

export default MoreInformation;
