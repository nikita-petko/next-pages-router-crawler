import React from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  Link,
  List,
  ListItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
} from '@rbx/ui';
import { columnLists } from './constants/links/public';
import type { TFooterProps } from './constants/type';
import usePublicFooterStyles from './PublicFooter.styles';

export default function PublicFooter({ className }: TFooterProps) {
  const { translate } = useTranslation();
  const {
    classes: { root, container, accordion },
    cx,
  } = usePublicFooterStyles();

  const isCompact = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  return (
    <Grid
      classes={{ root: cx(root, className) }}
      container
      alignItems='center'
      justifyContent='center'>
      <Grid className={container}>
        {isCompact
          ? columnLists.map(({ title, links }) => (
              <Accordion key={title} className={accordion} square>
                <AccordionSummary>
                  <Typography variant='subtitle2'>{translate(title)}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {links.map(({ path, title: linkTitle }) => (
                      <ListItem key={linkTitle} dense>
                        <Link href={path} color='inherit'>
                          <Typography variant='footer'>{translate(linkTitle)}</Typography>
                        </Link>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))
          : columnLists.map(({ title, links }) => (
              <List key={title}>
                <ListItem dense>
                  <Typography variant='captionHeader'>{translate(title)}</Typography>
                </ListItem>
                {links.map(({ path, title: linkTitle }) => (
                  <ListItem key={linkTitle} dense>
                    <Link href={path} color='inherit'>
                      <Typography variant='footer'>{translate(linkTitle)}</Typography>
                    </Link>
                  </ListItem>
                ))}
              </List>
            ))}
      </Grid>
    </Grid>
  );
}
