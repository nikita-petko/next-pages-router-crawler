import React, { FC, useState, useRef } from 'react';
import { Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@rbx/ui';
import { PlayerFeedbackExampleSection } from '@rbx/client-universe-analytics-insights/v1';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type PlayerFeedbackDetailsTableProps = {
  sections: PlayerFeedbackExampleSection[];
};

const PlayerFeedbackDetailsTable: FC<PlayerFeedbackDetailsTableProps> = ({ sections }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const [activeTag, setActiveTag] = useState(sections[0]?.tag);
  const counterRef = useRef(0);

  const activeComments =
    sections.find((section) => section.tag === activeTag)?.playerFeedbackExampleData || [];

  return (
    <div style={{ padding: '1rem', width: '100%' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {sections.map((section) => (
          <Chip
            key={section.tag}
            label={section.tag ? section.tag.charAt(0).toUpperCase() + section.tag.slice(1) : ''}
            clickable
            color={section.tag === activeTag ? 'primary' : 'secondary'}
            onClick={() => setActiveTag(section.tag)}
          />
        ))}
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant='subtitle2'>
                {translate(
                  translationKey('Label.QuoteTitle', TranslationNamespace.AnalyticsAssistant),
                )}
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activeComments.map((comment) => {
            counterRef.current += 1;
            return (
              <TableRow key={`${activeTag}-${counterRef.current}`}>
                <TableCell>
                  <Typography variant='body1'>
                    &quot;{comment.playerFeedbackExample}&quot;
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlayerFeedbackDetailsTable;
