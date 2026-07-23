import type { AnimationEventHandler, FunctionComponent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  Button,
  IconButton,
  Link,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type {
  TPendingHtmlTranslationFunction,
  TPendingTranslationFunction,
} from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DEVEX_TAX_HELP_URL } from '../../constants/externalLinkConstants';
import {
  logTaxHubHelpRailToggle,
  mapTaxbitProgressToTaxFlowStep,
} from '../../taxes/utils/taxTelemetry';
import styles from './TaxbitHelpCenter.module.css';

type TaxbitStepId = string;

export type TaxbitProgress = {
  stepId: TaxbitStepId;
  stepTitle: string;
  steps: TaxbitStepId[];
};

type HelpVariant =
  | 'accountClassification'
  | 'identificationW9'
  | 'identificationTreaty'
  | 'treatyClaims'
  | 'collectTaxW9'
  | 'collectTaxTreaty'
  | 'reviewW9'
  | 'reviewTreaty';

type HelpAccordionItem = {
  title: string;
  content: ReactNode;
};

type HelpContent = {
  title: string;
  intro: ReactNode;
  items: HelpAccordionItem[];
};

type HelpListItem = {
  key: string;
  content: ReactNode;
};

type PendingHtmlTags = NonNullable<Parameters<TPendingHtmlTranslationFunction>[3]>;

const paragraph = (children: ReactNode) => (
  <p className='text-body-medium content-default margin-none'>{children}</p>
);

const smallParagraph = (children: ReactNode) => (
  <p className='text-body-small content-default margin-none'>{children}</p>
);

const compactList = (items: HelpListItem[]) => (
  <ul className={styles.list}>
    {items.map((item) => (
      <li key={item.key}>{item.content}</li>
    ))}
  </ul>
);

const linkTag = (href: string): PendingHtmlTags => [
  {
    opening: 'linkStart',
    closing: 'linkEnd',
    content: (chunks: ReactNode) => (
      <Link href={href} target='_blank'>
        {chunks}
      </Link>
    ),
  },
];

const boldTag: PendingHtmlTags = [
  {
    opening: 'boldStart',
    closing: 'boldEnd',
    content: (chunks: ReactNode) => <strong>{chunks}</strong>,
  },
];

const getTaxbitHelpCenterContent = (
  tPendingTranslation: TPendingTranslationFunction,
  tPendingHtmlTranslation: TPendingHtmlTranslationFunction,
): Record<HelpVariant, HelpContent> => {
  const sharedTaxAdviceDisclaimer = tPendingTranslation(
    'Where helpful, we provide general explanations of the terms used in these forms to help you understand what the questions mean. This information is not tax advice. If you are unsure what to enter, please contact a parent, guardian, or qualified tax adviser.',
    'Tax advice disclaimer shown in Taxbit Help Center.',
    translationKey(
      'Taxes.HelpCenter.Description.Shared.TaxAdviceDisclaimer',
      TranslationNamespace.TaxDocumentation,
    ),
  );

  const sharedW9Intro = (
    <>
      {paragraph(
        tPendingTranslation(
          'We need this information to prepare your tax form and process your Roblox payments with the correct U.S. tax withholding.',
          'Intro text explaining why W9 tax form information is needed.',
          translationKey(
            'Taxes.HelpCenter.Description.SharedW9.PrepareTaxForm',
            TranslationNamespace.TaxDocumentation,
          ),
        ),
      )}
      {paragraph(
        tPendingTranslation(
          'If you do not submit the required tax information, your payments will be subject to 24% U.S. tax withholding.',
          'Warning that missing W9 tax information may cause 24% withholding.',
          translationKey(
            'Taxes.HelpCenter.Description.SharedW9.WithholdingWarning',
            TranslationNamespace.TaxDocumentation,
          ),
        ),
      )}
      {paragraph(sharedTaxAdviceDisclaimer)}
    </>
  );

  const sharedTreatyIntro = (
    <>
      {paragraph(
        tPendingTranslation(
          'We need this information to prepare your tax form and process your Roblox payments with the correct withholding.',
          'Intro text explaining why non-US tax form information is needed.',
          translationKey(
            'Taxes.HelpCenter.Description.SharedTreaty.PrepareTaxForm',
            TranslationNamespace.TaxDocumentation,
          ),
        ),
      )}
      {paragraph(sharedTaxAdviceDisclaimer)}
    </>
  );

  return {
    accountClassification: {
      title: tPendingTranslation(
        'Account classification',
        'Help Center section title for account classification step.',
        translationKey(
          'Taxes.HelpCenter.Heading.AccountClassification',
          TranslationNamespace.TaxDocumentation,
        ),
      ),
      intro: sharedW9Intro,
      items: [
        {
          title: tPendingTranslation(
            'U.S. permanent resident',
            'Accordion title explaining U.S. permanent resident status.',
            translationKey(
              'Taxes.HelpCenter.Accordion.UsPermanentResident.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {smallParagraph(
                tPendingTranslation(
                  'A U.S. permanent resident is someone who has been officially granted authorization to live and work in the United States indefinitely.',
                  'Description explaining U.S. permanent resident authorization',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.UsPermanentResident.AuthDesc',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'This status is granted by the U.S. Citizenship and Immigration Services (USCIS), which issues a Permanent Resident Card, commonly called a green card.',
                  'Description explaining the U.S. permanent resident green card',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.UsPermanentResident.GreenCardDesc',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingHtmlTranslation(
                  'For official details regarding residency requirements and definitions, please visit the {linkStart}IRS website{linkEnd}.',
                  'Description linking to IRS details about residency requirements',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.UsPermanentResident.IrsLinkDesc',
                    TranslationNamespace.TaxDocumentation,
                  ),
                  linkTag('https://www.irs.gov'),
                ),
              )}
            </>
          ),
        },
        {
          title: tPendingTranslation(
            'Substantial presence test',
            'Accordion title explaining substantial presence test.',
            translationKey(
              'Taxes.HelpCenter.Accordion.SubstantialPresenceTest.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {smallParagraph(
                tPendingTranslation(
                  'The Substantial Presence Test (SPT) is an Internal Revenue Service (IRS) standard used to determine whether you are considered a resident for U.S. federal income tax purposes.',
                  'Definition of the substantial presence test',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.SubstantialPresenceTest.Def',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'To meet this test for a calendar year, you must satisfy both of the following requirements:',
                  'Intro text for substantial presence test requirements',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.SubstantialPresenceTest.ReqIntro',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {compactList([
                {
                  key: 'currentYearPresence',
                  content: tPendingHtmlTranslation(
                    '{boldStart}Current Year Presence:{boldEnd} You must be physically present in the U.S. for at least 31 days during the current calendar year.',
                    'Bullet explaining the current year presence requirement',
                    translationKey(
                      'Taxes.HelpCenter.Accordion.Spt.Bullet.CurrentYear',
                      TranslationNamespace.TaxDocumentation,
                    ),
                    boldTag,
                  ),
                },
                {
                  key: 'weightedThreeYearPeriod',
                  content: tPendingHtmlTranslation(
                    '{boldStart}Weighted Three-Year Period:{boldEnd} You must be physically present in the U.S. for a total of 183 days over a three-year period using a weighted formula.',
                    'Bullet explaining the weighted three-year period requirement',
                    translationKey(
                      'Taxes.HelpCenter.Accordion.Spt.Bullet.WeightedThreeYear',
                      TranslationNamespace.TaxDocumentation,
                    ),
                    boldTag,
                  ),
                },
              ])}
              {smallParagraph(
                tPendingHtmlTranslation(
                  'For more detailed information and to review the official requirements, please consult the {linkStart}IRS website{linkEnd}.',
                  'Description linking to IRS substantial presence test requirements',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.SubstantialPresenceTest.IrsLink',
                    TranslationNamespace.TaxDocumentation,
                  ),
                  linkTag('https://www.irs.gov'),
                ),
              )}
            </>
          ),
        },
        {
          title: tPendingTranslation(
            'Account type',
            'Accordion title explaining account type choices.',
            translationKey(
              'Taxes.HelpCenter.Accordion.AccountType.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: compactList([
            {
              key: 'individual',
              content: tPendingHtmlTranslation(
                '{boldStart}Individual:{boldEnd} Select this if you are registering as a person.',
                'Bullet explaining the individual account type',
                translationKey(
                  'Taxes.HelpCenter.Accordion.AccountType.Bullet.Individual',
                  TranslationNamespace.TaxDocumentation,
                ),
                boldTag,
              ),
            },
            {
              key: 'entity',
              content: tPendingHtmlTranslation(
                "{boldStart}Entity:{boldEnd} If you are registering on behalf of a business or organization, then choose the specific account type that matches that business or organization's legal and tax status.",
                'Bullet explaining the entity account type',
                translationKey(
                  'Taxes.HelpCenter.Accordion.AccountType.Bullet.Entity',
                  TranslationNamespace.TaxDocumentation,
                ),
                boldTag,
              ),
            },
          ]),
        },
        {
          title: tPendingTranslation(
            'Beneficial owner',
            'Accordion title explaining beneficial owner.',
            translationKey(
              'Taxes.HelpCenter.Accordion.BeneficialOwner.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingTranslation(
              'For U.S. tax purposes, a beneficial owner is the person or entity that has the right to receive, use, and control the economic benefits of the payment, even if the legal title is held by someone else. In general, if you are receiving payments from Roblox on behalf of another person or business, you are not considered the beneficial owner.',
              'Description explaining beneficial owner for account classification',
              translationKey(
                'Taxes.HelpCenter.Accordion.BeneficialOwner.DescEntity',
                TranslationNamespace.TaxDocumentation,
              ),
            ),
          ),
        },
      ],
    },
    identificationW9: {
      title: tPendingTranslation(
        'Identification details',
        'Help Center section title for identification details steps.',
        translationKey(
          'Taxes.HelpCenter.Heading.IdentificationDetails',
          TranslationNamespace.TaxDocumentation,
        ),
      ),
      intro: sharedW9Intro,
      items: [
        {
          title: tPendingTranslation(
            'Legal name',
            'Accordion title explaining legal name.',
            translationKey(
              'Taxes.HelpCenter.Accordion.LegalName.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingTranslation(
              'Enter your complete legal name exactly as it appears on your government-issued ID. To help avoid delays or mismatches, do not use initials, shortened names, or nicknames unless they are part of your legal name on your official documents.',
              'Description explaining how to enter legal name.',
              translationKey(
                'Taxes.HelpCenter.Accordion.LegalName.Description',
                TranslationNamespace.TaxDocumentation,
              ),
            ),
          ),
        },
        {
          title: tPendingTranslation(
            'Address',
            'Accordion title explaining address.',
            translationKey(
              'Taxes.HelpCenter.Accordion.Address.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {smallParagraph(
                tPendingTranslation(
                  'Enter your physical home or business address.',
                  'Description explaining physical address.',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.Address.Description.Physical',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'Use your street address, including your apartment, unit, or suite number if applicable. This is the address where tax documents may be mailed to you.',
                  'Description explaining street address requirements.',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.Address.Description.Street',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
            </>
          ),
        },
      ],
    },
    identificationTreaty: {
      title: tPendingTranslation(
        'Identification details',
        'Help Center section title for identification details steps.',
        translationKey(
          'Taxes.HelpCenter.Heading.IdentificationDetails',
          TranslationNamespace.TaxDocumentation,
        ),
      ),
      intro: sharedTreatyIntro,
      items: [
        {
          title: tPendingTranslation(
            'Name details',
            'Accordion title explaining account holder name details.',
            translationKey(
              'Taxes.HelpCenter.Accordion.NameDetails.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {smallParagraph(
                tPendingTranslation(
                  'Name of individual',
                  'Label for individual name help text.',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.NameDetails.Label.Individual',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'If you are submitting as an individual, enter your complete legal name exactly as it appears on your government-issued ID. To help avoid delays or mismatches, do not use initials, shortened names, or nicknames unless they are part of your legal name on your official documents.',
                  'Description explaining how an individual should enter their legal name',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.NameDetails.DescIndividual',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'Name of corporation',
                  'Label for corporation name help text.',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.NameDetails.Label.Corporation',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'If you are submitting for a corporation, enter the full legal name of the business as officially registered.',
                  'Description explaining how a corporation should enter its legal name',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.NameDetails.DescCorporation',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
            </>
          ),
        },
        {
          title: tPendingTranslation(
            'Country details',
            'Accordion title explaining account holder country details.',
            translationKey(
              'Taxes.HelpCenter.Accordion.CountryDetails.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {smallParagraph(
                tPendingTranslation(
                  'Country of citizenship',
                  'Label for country of citizenship help text.',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.CountryDetails.Label.Citizenship',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'If you are submitting as an individual, enter the country where you hold citizenship. If you are a citizen of two countries, enter the country where you are both a citizen and a resident when you complete this form. If you do not currently live in any country where you hold citizenship, enter the country where you were most recently a resident.',
                  'Description explaining how an individual should enter country of citizenship',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.CountryDetails.DescCitizenship',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'Country of incorporation',
                  'Label for country of incorporation help text',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.CountryDetails.LabelIncorp',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'If you are submitting as a business, enter the country where the business is officially registered or legally formed.',
                  'Description explaining how a business should enter country of incorporation',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.CountryDetails.DescIncorp',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
            </>
          ),
        },
        {
          title: tPendingTranslation(
            'Address',
            'Accordion title explaining address.',
            translationKey(
              'Taxes.HelpCenter.Accordion.Address.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {smallParagraph(
                tPendingTranslation(
                  'Enter your physical home or business address.',
                  'Description explaining physical address.',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.Address.Description.Physical',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'Use your street address, including your apartment, unit, or suite number if applicable. This is the address where tax documents may be mailed to you. Do not use a P.O. Box or "In Care of" address as your main address on this form. Using these formats will invalidate your tax form and may require 24% U.S. tax withholding on your payments.',
                  'Description explaining treaty-flow street address requirements.',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.Address.Description.TreatyStreet',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  'If you want to receive your tax documents at a different address, such as a P.O. Box, you can provide a separate mailing address during setup.',
                  'Description explaining separate mailing address option',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.Address.DescMailingAddress',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
            </>
          ),
        },
      ],
    },
    treatyClaims: {
      title: tPendingTranslation(
        'Identification details',
        'Help Center section title for identification details steps.',
        translationKey(
          'Taxes.HelpCenter.Heading.IdentificationDetails',
          TranslationNamespace.TaxDocumentation,
        ),
      ),
      intro: sharedW9Intro,
      items: [
        {
          title: tPendingTranslation(
            'Eligible for treaty claim',
            'Accordion title explaining treaty claim eligibility.',
            translationKey(
              'Taxes.HelpCenter.Accordion.EligibleForTreatyClaim.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {smallParagraph(
                tPendingTranslation(
                  'Your payments from Roblox will be subject to U.S. withholding tax at a rate of 30% on the U.S.-source portion of the payment, unless reduced by treaty. For these purposes, a treaty claim is a formal request for a reduced U.S. withholding tax rate based on a tax treaty that your country of residence has with the U.S.',
                  'Description explaining treaty claim eligibility',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.EligibleForTreatyClaim.Desc',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {compactList([
                {
                  key: 'yes',
                  content: tPendingHtmlTranslation(
                    '{boldStart}Yes, I am eligible to claim a tax treaty:{boldEnd} If you are a resident of a country that has a tax treaty with the U.S., and you want to claim a reduced withholding rate under that treaty.',
                    'Bullet explaining when the user is eligible for treaty claim',
                    translationKey(
                      'Taxes.HelpCenter.Accordion.EligibleForTreatyClaim.Bullet.Yes',
                      TranslationNamespace.TaxDocumentation,
                    ),
                    boldTag,
                  ),
                },
                {
                  key: 'no',
                  content: tPendingHtmlTranslation(
                    '{boldStart}No, I am not eligible to claim a tax treaty:{boldEnd} You do not qualify for treaty benefits, do not want to claim them, or your country does not have a tax treaty with the U.S.',
                    'Bullet explaining when the user is not eligible for treaty claim',
                    translationKey(
                      'Taxes.HelpCenter.Accordion.EligibleForTreatyClaim.Bullet.No',
                      TranslationNamespace.TaxDocumentation,
                    ),
                    boldTag,
                  ),
                },
              ])}
            </>
          ),
        },
        {
          title: tPendingTranslation(
            'Treaty country',
            'Accordion title explaining treaty country.',
            translationKey(
              'Taxes.HelpCenter.Accordion.TreatyCountry.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingTranslation(
              'A treaty country is your country of residence that has a tax treaty with the U.S., under which you are claiming a reduced U.S. withholding tax rate.',
              'Description explaining treaty country.',
              translationKey(
                'Taxes.HelpCenter.Accordion.TreatyCountry.Description',
                TranslationNamespace.TaxDocumentation,
              ),
            ),
          ),
        },
        {
          title: tPendingTranslation(
            'Beneficial owner',
            'Accordion title explaining beneficial owner.',
            translationKey(
              'Taxes.HelpCenter.Accordion.BeneficialOwner.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingTranslation(
              'For U.S. tax purposes, a beneficial owner is the person or organization that has the right to receive, use, and control the economic benefit of the payment, even if the legal title is held by someone else. In general, if you are receiving payments from Roblox on behalf of another person or business, you are not considered the beneficial owner.',
              'Description explaining beneficial owner for treaty flows',
              translationKey(
                'Taxes.HelpCenter.Accordion.BeneficialOwner.DescOrg',
                TranslationNamespace.TaxDocumentation,
              ),
            ),
          ),
        },
        {
          title: tPendingTranslation(
            'Limitation on benefits provision',
            'Accordion title explaining limitation on benefits provision.',
            translationKey(
              'Taxes.HelpCenter.Accordion.LimitationOnBenefits.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingHtmlTranslation(
              'For help choosing the option that applies to your business or corporation, please consult Table 4 of the {linkStart}IRS tax treaty tables{linkEnd}.',
              'Description linking to IRS tax treaty tables for limitation on benefits provision',
              translationKey(
                'Taxes.HelpCenter.Accordion.LimitationOnBenefits.Description',
                TranslationNamespace.TaxDocumentation,
              ),
              linkTag('https://www.irs.gov'),
            ),
          ),
        },
        {
          title: tPendingTranslation(
            'U.S. withholding rate & article/paragraph',
            'Accordion title explaining withholding rate and article/paragraph.',
            translationKey(
              'Taxes.HelpCenter.Accordion.WithholdingRateArticle.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingTranslation(
              'The available fields are based on the income type and treaty country you selected earlier.',
              'Description explaining U.S. withholding rate and article paragraph fields',
              translationKey(
                'Taxes.HelpCenter.Accordion.WithholdingRateArticle.Desc',
                TranslationNamespace.TaxDocumentation,
              ),
            ),
          ),
        },
      ],
    },
    collectTaxW9: {
      title: tPendingTranslation(
        'Identification details',
        'Help Center section title for identification details steps.',
        translationKey(
          'Taxes.HelpCenter.Heading.IdentificationDetails',
          TranslationNamespace.TaxDocumentation,
        ),
      ),
      intro: sharedW9Intro,
      items: [
        {
          title: tPendingTranslation(
            'Social security number (SSN)',
            'Accordion title explaining SSN.',
            translationKey(
              'Taxes.HelpCenter.Accordion.Ssn.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {smallParagraph(
                tPendingTranslation(
                  'A SSN is a unique nine-digit number issued by the U.S. government to identify an individual.',
                  'Description defining SSN.',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.Ssn.Description.Definition',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {smallParagraph(
                tPendingTranslation(
                  "Minors under 18 must enter their own SSN, not a parent's or guardian's. Even if a parent or guardian later reports the Roblox income on their own U.S. tax return, the minor's SSN is still the required identifier for this process.",
                  'Description explaining minors must enter their own SSN.',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.Ssn.Description.Minors',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
            </>
          ),
        },
        {
          title: tPendingTranslation(
            'Employer identification number (EIN)',
            'Accordion title explaining EIN.',
            translationKey(
              'Taxes.HelpCenter.Accordion.Ein.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingTranslation(
              'An EIN is a unique nine-digit number assigned by the IRS to identify a business.',
              'Description defining EIN.',
              translationKey(
                'Taxes.HelpCenter.Accordion.Ein.Description',
                TranslationNamespace.TaxDocumentation,
              ),
            ),
          ),
        },
      ],
    },
    collectTaxTreaty: {
      title: tPendingTranslation(
        'Identification details',
        'Help Center section title for identification details steps.',
        translationKey(
          'Taxes.HelpCenter.Heading.IdentificationDetails',
          TranslationNamespace.TaxDocumentation,
        ),
      ),
      intro: sharedTreatyIntro,
      items: [
        {
          title: tPendingTranslation(
            'Tax information',
            'Accordion title explaining treaty tax information.',
            translationKey(
              'Taxes.HelpCenter.Accordion.TaxInformation.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingTranslation(
              'To claim certain treaty benefits, you must provide either a United States or Foreign Taxpayer Identification Number (TIN).',
              'Description explaining TIN requirements for claiming treaty benefits',
              translationKey(
                'Taxes.HelpCenter.Accordion.TaxInformation.DescTreatyTin',
                TranslationNamespace.TaxDocumentation,
              ),
            ),
          ),
        },
        {
          title: tPendingTranslation(
            'United States TIN',
            'Accordion title explaining United States TIN.',
            translationKey(
              'Taxes.HelpCenter.Accordion.UnitedStatesTin.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {compactList([
                {
                  key: 'individual',
                  content: tPendingTranslation(
                    'If you are an individual, a U.S. TIN is a U.S. taxpayer identification number, such as a Social Security Number (SSN) or Individual TIN (ITIN).',
                    'Bullet explaining U.S. TIN for individuals.',
                    translationKey(
                      'Taxes.HelpCenter.Accordion.UnitedStatesTin.Bullet.Individual',
                      TranslationNamespace.TaxDocumentation,
                    ),
                  ),
                },
                {
                  key: 'entity',
                  content: tPendingTranslation(
                    'If you are an entity, a U.S. TIN is your Employer Identification Number (EIN). If you have one, enter it here.',
                    'Bullet explaining U.S. TIN for entities.',
                    translationKey(
                      'Taxes.HelpCenter.Accordion.UnitedStatesTin.Bullet.Entity',
                      TranslationNamespace.TaxDocumentation,
                    ),
                  ),
                },
              ])}
              {smallParagraph(
                tPendingTranslation(
                  'Note that a U.S. TIN is not required, unless you are claiming a lower U.S. withholding tax rate under a tax treaty, and you have not provided a Foreign TIN.',
                  'Description explaining when a U.S. TIN is not required',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.UnitedStatesTin.DescNotRequired',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
            </>
          ),
        },
        {
          title: tPendingTranslation(
            'Foreign TIN (ABN)',
            'Accordion title explaining foreign TIN.',
            translationKey(
              'Taxes.HelpCenter.Accordion.ForeignTin.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {smallParagraph(
                tPendingTranslation(
                  'A foreign TIN is the tax identification number issued by your country of residence.',
                  'Description defining foreign TIN.',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.ForeignTin.Description',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {compactList([
                {
                  key: 'notRequired',
                  content: tPendingHtmlTranslation(
                    '{boldStart}Foreign TIN is not required:{boldEnd} Choose this option if your country does not issue TINs or does not allow you to share them.',
                    'Bullet explaining when foreign TIN is not required',
                    translationKey(
                      'Taxes.HelpCenter.Accordion.ForeignTin.Bullet.NotRequired',
                      TranslationNamespace.TaxDocumentation,
                    ),
                    boldTag,
                  ),
                },
              ])}
            </>
          ),
        },
      ],
    },
    reviewW9: {
      title: tPendingTranslation(
        'Review & summary',
        'Help Center section title for review and summary steps.',
        translationKey(
          'Taxes.HelpCenter.Heading.ReviewSummary',
          TranslationNamespace.TaxDocumentation,
        ),
      ),
      intro: sharedW9Intro,
      items: [
        {
          title: tPendingTranslation(
            'Taxpayer identification number (TIN)',
            'Accordion title explaining taxpayer identification number',
            translationKey(
              'Taxes.HelpCenter.Accordion.TaxpayerIdNumber.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: (
            <>
              {smallParagraph(
                tPendingTranslation(
                  'This is the tax ID you entered earlier.',
                  'Description explaining taxpayer identification number on review step',
                  translationKey(
                    'Taxes.HelpCenter.Accordion.TaxpayerIdNumber.Description',
                    TranslationNamespace.TaxDocumentation,
                  ),
                ),
              )}
              {compactList([
                {
                  key: 'individual',
                  content: tPendingTranslation(
                    'For an individual, this is your SSN.',
                    'Bullet explaining TIN for individuals on review step',
                    translationKey(
                      'Taxes.HelpCenter.Accordion.TaxpayerIdNum.Bullet.Individual',
                      TranslationNamespace.TaxDocumentation,
                    ),
                  ),
                },
                {
                  key: 'business',
                  content: tPendingTranslation(
                    'For a business, this is generally your EIN.',
                    'Bullet explaining TIN for businesses on review step',
                    translationKey(
                      'Taxes.HelpCenter.Accordion.TaxpayerIdNum.Bullet.Business',
                      TranslationNamespace.TaxDocumentation,
                    ),
                  ),
                },
              ])}
            </>
          ),
        },
        {
          title: tPendingTranslation(
            'U.S. backup withholding',
            'Accordion title explaining U.S. backup withholding.',
            translationKey(
              'Taxes.HelpCenter.Accordion.BackupWithholding.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingTranslation(
              'Backup withholding is an IRS requirement to withhold 24% from certain payments.',
              'Description explaining U.S. backup withholding.',
              translationKey(
                'Taxes.HelpCenter.Accordion.BackupWithholding.Description',
                TranslationNamespace.TaxDocumentation,
              ),
            ),
          ),
        },
      ],
    },
    reviewTreaty: {
      title: tPendingTranslation(
        'Review & summary',
        'Help Center section title for review and summary steps.',
        translationKey(
          'Taxes.HelpCenter.Heading.ReviewSummary',
          TranslationNamespace.TaxDocumentation,
        ),
      ),
      intro: sharedTreatyIntro,
      items: [
        {
          title: tPendingTranslation(
            'Beneficial owner',
            'Accordion title explaining beneficial owner.',
            translationKey(
              'Taxes.HelpCenter.Accordion.BeneficialOwner.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingTranslation(
              'For U.S. tax purposes, a beneficial owner is the person or organization that has the right to receive, use, and control the economic benefit of the payment, even if the legal title is held by someone else. In general, if you are receiving payments from Roblox on behalf of another person or business, you are not considered the beneficial owner.',
              'Description explaining beneficial owner for treaty flows',
              translationKey(
                'Taxes.HelpCenter.Accordion.BeneficialOwner.DescOrg',
                TranslationNamespace.TaxDocumentation,
              ),
            ),
          ),
        },
        {
          title: tPendingTranslation(
            'Income effectively connected with the conduct of a US trade or business',
            'Accordion title explaining effectively connected income.',
            translationKey(
              'Taxes.HelpCenter.Accordion.IncomeEffectivelyConnected.Title',
              TranslationNamespace.TaxDocumentation,
            ),
          ),
          content: smallParagraph(
            tPendingTranslation(
              'This means income generated from activities performed in the United States.',
              'Description explaining income effectively connected with a US trade or business',
              translationKey(
                'Taxes.HelpCenter.Accordion.IncomeEffectivelyConnected.Desc',
                TranslationNamespace.TaxDocumentation,
              ),
            ),
          ),
        },
      ],
    },
  };
};

const stepToVariant = (progress: TaxbitProgress | null): HelpVariant => {
  const steps = progress?.steps ?? [];
  const hasTreatyStep =
    steps.includes('accountHolderTreatyClaims') || steps.includes('regardedOwnerTreatyClaims');
  const stepId = progress?.stepId ?? 'accountHolderClassification';

  switch (stepId) {
    case 'accountHolderContactInformation':
    case 'regardedOwnerContactInformation':
      return hasTreatyStep ? 'identificationTreaty' : 'identificationW9';
    case 'accountHolderTaxInformation':
    case 'accountHolderUsTinValidation':
    case 'accountHolderAdditionalInfo':
    case 'exemptions':
    case 'regardedOwnerTaxInformation':
    case 'regardedOwnerUsTinValidation':
      return hasTreatyStep ? 'collectTaxTreaty' : 'collectTaxW9';
    case 'accountHolderTreatyClaims':
    case 'regardedOwnerTreatyClaims':
      return 'treatyClaims';
    case 'accountHolderCertifications':
    case 'regardedOwnerCertifications':
    case 'confirmation':
    case 'summary':
      return hasTreatyStep ? 'reviewTreaty' : 'reviewW9';
    case 'accountHolderClassification':
    default:
      return 'accountClassification';
  }
};

const TaxbitHelpCenter: FunctionComponent<{ progress: TaxbitProgress | null }> = ({ progress }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(true);
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { tPendingHtmlTranslation, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const helpCenterLabel = tPendingTranslation(
    'Need help?',
    'Button and sheet title for opening Taxbit tax submission guidance.',
    translationKey('Taxes.HelpCenter.Action.NeedHelp', TranslationNamespace.TaxDocumentation),
  );
  const closeLabel = tPendingTranslation(
    'Close',
    'Accessibility label for closing Taxbit Help Center.',
    translationKey('Taxes.HelpCenter.Action.Close', TranslationNamespace.TaxDocumentation),
  );
  const footerDescription = tPendingHtmlTranslation(
    'For more information, check out the {linkStart}Developer Exchange Help Center{linkEnd}.',
    'Footer link text for the Taxbit help center',
    translationKey('Taxes.HelpCenter.Footer.Description', TranslationNamespace.TaxDocumentation),
    [
      {
        opening: 'linkStart',
        closing: 'linkEnd',
        content: (chunks) => (
          <Link href={DEVEX_TAX_HELP_URL} target='_blank' size='Medium'>
            {chunks}
          </Link>
        ),
      },
    ],
  );
  const helpContentByVariant = useMemo(
    () => getTaxbitHelpCenterContent(tPendingTranslation, tPendingHtmlTranslation),
    [tPendingHtmlTranslation, tPendingTranslation],
  );
  const content = useMemo(
    () => helpContentByVariant[stepToVariant(progress)],
    [helpContentByVariant, progress],
  );
  const telemetryStep = mapTaxbitProgressToTaxFlowStep(progress);
  const openHelpCenter = useCallback(() => {
    if (isOpen) {
      return;
    }

    setIsMounted(true);
    setIsOpen(true);
    logTaxHubHelpRailToggle(unifiedLogger, 'expand', telemetryStep);
  }, [isOpen, telemetryStep, unifiedLogger]);
  const closeHelpCenter = useCallback(() => {
    if (!isOpen) {
      return;
    }

    setIsOpen(false);
    logTaxHubHelpRailToggle(unifiedLogger, 'collapse', telemetryStep);
  }, [isOpen, telemetryStep, unifiedLogger]);
  const handlePanelAnimationEnd: AnimationEventHandler<HTMLElement> = useCallback(
    (event) => {
      if (event.target === event.currentTarget && !isOpen) {
        setIsMounted(false);
      }
    },
    [isOpen],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeHelpCenter();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeHelpCenter, isOpen]);

  return (
    <div className={styles.root}>
      <Button
        variant='Standard'
        size='Small'
        icon='icon-regular-circle-question'
        aria-controls='taxbit-help-center'
        aria-expanded={isOpen}
        onClick={openHelpCenter}>
        {helpCenterLabel}
      </Button>
      {isMounted &&
        createPortal(
          <aside
            id='taxbit-help-center'
            aria-label={helpCenterLabel}
            aria-hidden={!isOpen}
            data-state={isOpen ? 'open' : 'closed'}
            className={styles.panel}
            onAnimationEnd={handlePanelAnimationEnd}>
            <header className={styles.panelHeader}>
              <h2 className='text-heading-small content-emphasis margin-none'>{helpCenterLabel}</h2>
              <IconButton
                variant='Utility'
                size='Medium'
                icon='icon-regular-x'
                ariaLabel={closeLabel}
                onClick={closeHelpCenter}
              />
            </header>
            <div className={styles.panelBody}>
              <div className='flex flex-col gap-large'>
                <section className='flex flex-col gap-medium'>
                  <h2 className='text-title-large content-default margin-none'>{content.title}</h2>
                  <div className='flex flex-col gap-medium'>{content.intro}</div>
                </section>
                <Accordion hasDivider isContained size='Medium' className={styles.accordion}>
                  {content.items.map((item) => (
                    <AccordionItem key={item.title}>
                      <AccordionItemTrigger>
                        <span className='text-title-small content-default'>{item.title}</span>
                      </AccordionItemTrigger>
                      <AccordionItemContent>
                        <div className={styles.accordionContent}>{item.content}</div>
                      </AccordionItemContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <p className='text-body-medium content-default margin-none'>{footerDescription}</p>
              </div>
            </div>
          </aside>,
          document.body,
        )}
    </div>
  );
};

export default TaxbitHelpCenter;
