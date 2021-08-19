import React from 'react';
import { useTranslation } from 'react-i18next';
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
import Pagination from 'carbon-components-react/es/components/Pagination';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { attach } from '@openmrs/esm-framework';
import { useAllergies } from './allergy-intolerance.resource';
import { patientAllergiesFormWorkspace } from '../constants';
import styles from './allergies-overview.scss';
const allergiesToShowCount = 5;

interface AllergiesOverviewProps {
  basePath: string;
  patient: fhir.Patient;
  showAddAllergy: boolean;
}

const AllergiesOverview: React.FC<AllergiesOverviewProps> = ({ patient, showAddAllergy }) => {
  const { t } = useTranslation();
  const displayText = t('allergyIntolerances', 'allergy intolerances');
  const headerTitle = t('allergies', 'Allergies');
  const previousPage = t('previousPage', 'Previous page');
  const nextPage = t('nextPage', 'Next Page');
  const itemPerPage = t('itemPerPage', 'Item per page');

  const [firstRowIndex, setFirstRowIndex] = React.useState(0);
  const [currentPageSize, setCurrentPageSize] = React.useState(5);
  const { data: allergies, isError, isLoading } = useAllergies(patient.identifier[0].value);

  const launchAllergiesForm = React.useCallback(
    () => attach('patient-chart-workspace-slot', patientAllergiesFormWorkspace),
    [],
  );

  const tableHeaders = React.useMemo(
    () => [
      {
        key: 'display',
        header: t('name', 'Name'),
      },
      {
        key: 'reactions',
        header: t('reactions', 'Reactions'),
      },
    ],
    [t],
  );

  const tableRows = React.useMemo(() => {
    return allergies?.slice(firstRowIndex, firstRowIndex + currentPageSize)?.map((allergy) => ({
      ...allergy,
      reactions: `${allergy.reactionManifestations?.join(', ') || ''} ${
        allergy.reactionSeverity ? `(${allergy.reactionSeverity})` : ''
      }`,
    }));
  }, [allergies, currentPageSize, firstRowIndex]);

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
          <DataTable rows={tableRows} headers={tableHeaders} isSortable={true} size="short">
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
          {allergies.length > allergiesToShowCount && (
            <Pagination
              totalItems={allergies.length}
              backwardText={previousPage}
              forwardText={nextPage}
              pageSize={currentPageSize}
              pageSizes={[5, 10, 15, 25]}
              itemsPerPageText={itemPerPage}
              onChange={({ page, pageSize }) => {
                if (pageSize !== currentPageSize) {
                  setCurrentPageSize(pageSize);
                }
                setFirstRowIndex(pageSize * (page - 1));
              }}
            />
          )}
        </TableContainer>
      </div>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchAllergiesForm} />;
};

export default AllergiesOverview;
