import React, { FunctionComponent, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { Grid } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/common';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import {
  useLicenseManagerLogger,
  LicenseManagerClickEvent,
} from '@modules/ip/license-manager/utils/logger';
import GuidelinesAndRestrictionsSummaryModal from '@modules/ip/license-manager/components/GuidelinesAndRestrictionsSummaryModal';
import { LicenseResponse } from '@rbx/clients/contentLicensingApi/v1';
import { JsonLd } from './JsonLd';
import useListIPLicenses from '../hooks/useListIPLicenses';
import LicenseDetailsModal from './LicenseDetailsModal';
import LicenseAccordion from './LicenseAccordion';

function getLicenseUpdatedAtMillis(license: LicenseResponse): number {
  const raw = license.updatedAt;
  if (raw == null) {
    return Number.NEGATIVE_INFINITY;
  }
  const ms = raw instanceof Date ? raw.getTime() : new Date(String(raw)).getTime();
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

/** Newest `updatedAt` first; licenses without a usable timestamp sort last. */
function sortLicensesByUpdatedAtDesc(licenses: LicenseResponse[]): LicenseResponse[] {
  return [...licenses].sort((a, b) => getLicenseUpdatedAtMillis(b) - getLicenseUpdatedAtMillis(a));
}

interface LicensesListProps {
  listingId: string;
}

interface LicensesAccordionsGridProps {
  licenses: LicenseResponse[];
  onClickViewDetails: (license: LicenseResponse) => () => void;
}

/**
 * Accordions default to expanded on first paint (empty collapsed set). Collapse state is reset when
 * `listingId` changes via `key={listingId}` on the parent render.
 */
const LicensesAccordionsGrid: FunctionComponent<LicensesAccordionsGridProps> = ({
  licenses,
  onClickViewDetails,
}) => {
  const [collapsedLicenseIds, setCollapsedLicenseIds] = useState<Set<string>>(() => new Set());

  const handleAccordionChange =
    (licenseId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setCollapsedLicenseIds((prev) => {
        const next = new Set(prev);
        if (isExpanded) {
          next.delete(licenseId);
        } else {
          next.add(licenseId);
        }
        return next;
      });
    };

  return (
    <Grid container flexDirection='column' spacing={2}>
      {licenses.map((license) => (
        <Grid item key={license.id}>
          <LicenseAccordion
            license={license}
            isExpanded={!collapsedLicenseIds.has(license.id!)}
            onAccordionChange={handleAccordionChange}
            onViewDetails={onClickViewDetails}
          />
        </Grid>
      ))}
    </Grid>
  );
};

/** A component that displays a list of licenses for a given listing id. */
const LicensesList: FunctionComponent<LicensesListProps> = ({ listingId }) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();

  const [isLicenseDetailsModalOpen, setIsLicenseDetailsModalOpen] = useState(false);
  const [isGuidelinesAndRestrictionsModalOpen, setIsGuidelinesAndRestrictionsModalOpen] =
    useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseResponse | null>(null);

  const onClickViewDetails = (license: LicenseResponse) => () => {
    setSelectedLicense(license);
    setIsLicenseDetailsModalOpen(true);
    logEvent(LicenseManagerClickEvent.ViewLicenseDetailsClickEvent, {
      licenseId: license.id!,
    });
  };

  const { isPending, isError, data } = useListIPLicenses({
    listingId,
    limit: 30,
  });

  const handleGuidelinesAndRestrictionsClick = useCallback(() => {
    setIsLicenseDetailsModalOpen(false);
    setIsGuidelinesAndRestrictionsModalOpen(true);
  }, []);

  const licensesNewestFirst = useMemo(() => {
    if (!data?.licenses?.length) {
      return [];
    }
    return sortLicensesByUpdatedAtDesc(data.licenses);
  }, [data?.licenses]);

  if (isPending) {
    return <PageLoading />;
  }

  if (isError || !data?.licenses || data.licenses.length === 0) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  return (
    <React.Fragment>
      <Head>
        <JsonLd
          id='licenses-itemlist-jsonld'
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            numberOfItems: licensesNewestFirst.length,
            itemListElement: licensesNewestFirst.map((license, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: license.name,
              description: license.description,
            })),
          }}
        />
      </Head>
      <LicenseDetailsModal
        isOpen={isLicenseDetailsModalOpen}
        setOpen={setIsLicenseDetailsModalOpen}
        license={selectedLicense}
        handleGuidelinesAndRestrictionsClick={handleGuidelinesAndRestrictionsClick}
      />
      <GuidelinesAndRestrictionsSummaryModal
        isOpen={isGuidelinesAndRestrictionsModalOpen}
        setOpen={setIsGuidelinesAndRestrictionsModalOpen}
        license={selectedLicense}
        isCreator
      />
      <LicensesAccordionsGrid
        key={listingId}
        licenses={licensesNewestFirst}
        onClickViewDetails={onClickViewDetails}
      />
    </React.Fragment>
  );
};

export default LicensesList;
