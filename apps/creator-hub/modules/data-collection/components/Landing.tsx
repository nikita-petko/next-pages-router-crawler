import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { useMediaQuery, Typography, Button, Link } from '@rbx/ui';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { Body, Flex, Header, SubHeader } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { terms } from '@modules/miscellaneous/urls';
import { getLoginUrl, publicLuauTabUrl } from '../utils/urlUtils';
import Card from './common/Card';
import CardContent from './common/CardContent';
import useStyles from './Landing.styles';

type TDataCollectionProps = {
  isAuthenticated: boolean;
};
const DataCollection: FunctionComponent<React.PropsWithChildren<TDataCollectionProps>> = ({
  isAuthenticated,
}) => {
  const {
    classes: { layout, header, headerContent, card, cardContent, footer, footerContent },
  } = useStyles();
  const { translate, translateHTML } = useTranslation();
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  const onClick = async () => {
    unifiedLoggerClient.logClickEvent({
      eventName: 'clickGetStarted',
    });

    const loginUrl = await getLoginUrl(publicLuauTabUrl);

    await new Promise((resolve) => setTimeout(resolve, 100));
    if (isAuthenticated) {
      window.open(publicLuauTabUrl, '_self');
      return;
    }
    window.open(loginUrl, '_self');
  };

  return (
    <Flex classes={{ root: layout }} flexDirection='column'>
      <Flex classes={{ root: header }} alignItems='center' justifyContent='center'>
        <Flex classes={{ root: headerContent }} flexDirection='column'>
          <Header>{translate('Heading.EmpowerCreators')}</Header>
          <Body>{translate('Description.EmpowerCreators')}</Body>
        </Flex>
        <Flex classes={{ root: headerContent }} flexDirection='column'>
          <Flex flexDirection='column'>
            <Body>{translate('Label.Public')}</Body>
            <Body color='secondary'>{translate('Description.Public')}</Body>
          </Flex>
          <Typography variant={isSm ? 'footer' : 'captionHeader'}>
            {translateHTML('Label.Disclaimer1', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return <Link href={terms.getDataCollectionUrl()}>{chunks}</Link>;
                },
              },
            ])}
          </Typography>
          <Button onClick={onClick} variant='contained' data-testid='data-collection-get-started-1'>
            {translate('Action.GetStarted')}
          </Button>
        </Flex>
      </Flex>
      <Card classes={{ root: card }}>
        <CardContent>
          <Header classes={{ root: cardContent }}>{translate('Heading.Public')}</Header>
          <SubHeader classes={{ root: cardContent }}>
            {translate('Heading.PublicExplanation')}
          </SubHeader>
          <Body classes={{ root: cardContent }}>{translate('Description.PublicExplanation1')}</Body>
          <ul>
            <li>
              <Body>
                {translateHTML('Description.PublicExplanation2', [
                  {
                    opening: 'headingStart',
                    closing: 'headingEnd',
                    content(chunks) {
                      return <Body bold>{chunks}</Body>;
                    },
                  },
                ])}
              </Body>
            </li>
            <li>
              <Body>
                {translateHTML('Description.PublicExplanation3', [
                  {
                    opening: 'headingStart',
                    closing: 'headingEnd',
                    content(chunks) {
                      return <Body bold>{chunks}</Body>;
                    },
                  },
                ])}
              </Body>
            </li>
          </ul>
          <SubHeader classes={{ root: cardContent }}>{translate('Heading.Contribute')}</SubHeader>
          <Body classes={{ root: cardContent }}>
            {translate('Description.PublicContribution1')}
          </Body>
          <Body>
            {translateHTML('Description.PublicContribution2', [
              {
                opening: 'headingStart',
                closing: 'headingEnd',
                content(chunks) {
                  return <Body bold>{chunks}</Body>;
                },
              },
            ])}
          </Body>
        </CardContent>
      </Card>
      <Flex classes={{ root: footer }} flexDirection='column'>
        <Header classes={{ root: footerContent }}>{translate('Heading.LuauStrong')}</Header>
        <Flex flexDirection='column'>
          <Body>{translate('Label.Public')}</Body>
          <ul>
            <li>
              <Body>{translate('Description.Public1')}</Body>
            </li>
            <li>
              <Body>{translate('Description.Public2')}</Body>
            </li>
            <li>
              <Body>{translate('Description.Public3')}</Body>
            </li>
            <li>
              <Body>{translate('Description.Public4')}</Body>
            </li>
          </ul>
        </Flex>
        <Typography variant={isSm ? 'footer' : 'captionHeader'}>
          {translateHTML('Label.Disclaimer1', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks) {
                return <Link href={terms.getDataCollectionUrl()}>{chunks}</Link>;
              },
            },
          ])}
        </Typography>
        <Button
          onClick={onClick}
          classes={{ root: footerContent }}
          variant='contained'
          data-testid='data-collection-get-started-2'>
          {translate('Action.GetStarted')}
        </Button>
      </Flex>
    </Flex>
  );
};

export default withTranslation(DataCollection, [TranslationNamespace.DataCollection]);
