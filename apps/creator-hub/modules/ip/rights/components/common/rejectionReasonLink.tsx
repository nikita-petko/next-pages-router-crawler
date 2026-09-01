import type { ReactNode } from 'react';
import React from 'react';
import { Link } from '@rbx/ui';

// Some rejection reasons reference an external help article. The rights service
// (github.rbx.com/roblox/rights) sends these reasons as plain text, so we embed the
// hyperlink on the frontend — keyed off a stable phrase in the message — rather than
// baking a raw URL into the backend copy. If a backend message changes, update `phrase`
// (and `match`) to match. Shared by RejectReasonModal and DetailRejectionBlock.
const REJECTION_REASON_LINKS: {
  // A distinctive phrase that uniquely identifies the message needing a link.
  match: string;
  // The exact phrase within the message; only `linkText` inside it becomes the link.
  phrase: string;
  // The word (within `phrase`) that is rendered as the link.
  linkText: string;
  // The link destination.
  url: string;
}[] = [
  {
    match: 'in-game reporting flow in highlight mode',
    phrase: 'instructions here',
    linkText: 'here',
    url: 'https://about.roblox.com/newsroom/2026/07/how-in-game-reporting-works-on-roblox',
  },
];

type RejectionReasonLink = (typeof REJECTION_REASON_LINKS)[number];

// findRejectionReasonLink returns the link config whose `match` phrase appears anywhere in
// the full reason text, or undefined when the reason needs no embedded link.
export const findRejectionReasonLink = (
  reason: string | undefined,
): RejectionReasonLink | undefined =>
  reason ? REJECTION_REASON_LINKS.find((l) => reason.includes(l.match)) : undefined;

// renderReasonSegment renders a single paragraph of a status reason, turning the
// configured `linkText` into a hyperlink when the paragraph contains the matching phrase.
export const renderReasonSegment = (
  segment: string,
  link: RejectionReasonLink | undefined,
): ReactNode => {
  if (!link) {
    return segment;
  }
  const phraseIndex = segment.indexOf(link.phrase);
  if (phraseIndex === -1) {
    return segment;
  }
  // Locate `linkText` within `phrase` so we only linkify the intended word
  // (e.g. "here" in "instructions here", not the "here" inside "Therefore").
  const linkStart = phraseIndex + link.phrase.length - link.linkText.length;
  return (
    <>
      {segment.slice(0, linkStart)}
      <Link href={link.url} target='_blank'>
        {link.linkText}
      </Link>
      {segment.slice(linkStart + link.linkText.length)}
    </>
  );
};
