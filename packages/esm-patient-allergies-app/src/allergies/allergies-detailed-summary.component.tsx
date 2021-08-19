import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { attach } from '@openmrs/esm-framework';
import { useAllergies } from './allergy-intolerance.resource';
import Add16 from '@carbon/icons-react/es/add/16';
import Button from 'carbon-components-react/es/components/Button';
import DataTableSkeleton from 'carbon-components-react/es/components/DataTableSkeleton';
import DataTable, {
  Table,
  TableCell,
  TableContainer,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from 'carbon-components-react/es/components/DataTable';
import styles from './allergies-detailed-summary.scss';
import { patientAllergiesFormWorkspace } from '../constants';
const allergiesToShowCount = 5;

interface AllergiesDetailedSummaryProps {
  patient: fhir.Patient;
  showAddAllergy: boolean;
}

const AllergiesDetailedSummary: React.FC<AllergiesDetailedSummaryProps> = ({ patient, showAddAllergy }) => {
  const { t } = useTranslation();
  const displayText = t('allergyIntolerances', 'allergy intolerances');
  const headerTitle = t('allergies', 'Allergies');

  const { data: allergies, isError, isLoading } = useAllergies(patient.identifier[0].value);

  const launchAllergiesForm = React.useCallback(
    () => attach('patient-chart-workspace-slot', patientAllergiesFormWorkspace),
    [],
  );

  const tableHeaders = React.useMemo(
    () => [
      { key: 'display', header: t('allergen', 'Allergen') },
      {
        key: 'criticality',
        header: t('severityandReaction', 'Severity and Reaction'),
      },
      {
        key: 'recordedDate',
        header: t('since', 'Since'),
      },
      {
        key: 'lastUpdated',
        header: t('lastUpdated', 'Last updated'),
      },
    ],
    [t],
  );

  const tableRows = React.useMemo(() => {
    return allergies?.map((allergy) => ({
      ...allergy,
      criticality: {
        content: (
          <div className={styles.allergyDetails}>
            <p className={styles.allergyCriticality}>
              {allergy?.criticality === 'high' && (
                <svg className="omrs-icon omrs-margin-right-4" fill="rgba(181, 7, 6, 1)" style={{ height: '1.25rem' }}>
                  <use xlinkHref="#omrs-icon-important-notification" />
                </svg>
              )}
              <span
                className={`${styles.allergySeverity} ${
                  allergy?.criticality === 'high' ? styles.productiveHeading02 : styles.bodyShort02
                }`}>
                {allergy?.criticality}
              </span>
            </p>
            <p>{allergy?.reactionManifestations.join(', ')}</p>
            <p className={styles.note}>{allergy?.note}</p>
          </div>
        ),
      },
      recordedDate: dayjs(allergy?.recordedDate).format('MMM-YYYY') ?? '-',
      lastUpdated: dayjs(allergy?.lastUpdated).format('DD-MMM-YYYY'),
    }));
  }, [allergies]);

  if (isLoading) return <DataTableSkeleton role="progressbar" rowCount={allergiesToShowCount} />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;
  if (allergies?.length) {
    return (
      <div>
        <div className={styles.allergiesHeader}>
          <h4 className={`${styles.productiveHeading03} ${styles.text02}`}>{headerTitle}</h4>
          {showAddAllergy && (
            <Button kind="ghost" renderIcon={Add16} iconDescription="Add allergies" onClick={launchAllergiesForm}>
              {t('add', 'Add')}
            </Button>
          )}
        </div>
        <TableContainer>
          <DataTable rows={tableRows} headers={tableHeaders} isSortable={true}>
            {({ rows, headers, getHeaderProps, getTableProps }) => (
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader
                        className={`${styles.productiveHeading01} ${styles.text02}`}
                        {...getHeaderProps({
                          header,
                          isSortable: header.isSortable,
                        })}>
                        {header.header?.content ?? header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataTable>
        </TableContainer>
      </div>
    );
  }
  return <EmptyState headerTitle={headerTitle} displayText={displayText} />;
};

export default AllergiesDetailedSummary;
