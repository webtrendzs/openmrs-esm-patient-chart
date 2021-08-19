import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import Add16 from '@carbon/icons-react/es/add/16';
import Button from 'carbon-components-react/es/components/Button';
import Pagination from 'carbon-components-react/es/components/Pagination';
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
import { attach } from '@openmrs/esm-framework';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { useProgramEnrollments } from './programs.resource';
import { PatientProgram } from '../types';
import styles from './programs-overview.scss';
const programsToShowCount = 5;

interface ProgramsOverviewProps {
  basePath: string;
  patientUuid: string;
}

const ProgramsOverview: React.FC<ProgramsOverviewProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const displayText = t('programs', 'Program enrollments');
  const headerTitle = t('carePrograms', 'Care Programs');
  const previousPage = t('previousPage', 'Previous page');
  const nextPage = t('nextPage', 'Next Page');
  const itemsPerPage = t('itemsPerPage', 'Items per page');

  const [firstRowIndex, setFirstRowIndex] = React.useState(0);
  const [currentPageSize, setCurrentPageSize] = React.useState(5);
  const { data, isError, isLoading } = useProgramEnrollments(patientUuid);
  // console.log('data: ', data);
  const activeEnrollments = data ? data.filter((enrollment) => !enrollment.dateCompleted) : null;

  const launchProgramsForm = React.useCallback(() => attach('patient-chart-workspace-slot', 'programs-workspace'), []);

  const tableHeaders = React.useMemo(
    () => [
      {
        key: 'display',
        header: t('activePrograms', 'Active programs'),
      },
      {
        key: 'dateEnrolled',
        header: t('dateEnrolled', 'Date enrolled'),
      },
    ],
    [t],
  );

  const tableRows: Array<PatientProgram> = React.useMemo(() => {
    return activeEnrollments?.slice(firstRowIndex, firstRowIndex + currentPageSize)?.map((program) => ({
      ...program,
      id: program.uuid,
      display: program.display,
      dateEnrolled: dayjs(program.dateEnrolled).format('MMM-YYYY'),
    }));
  }, [currentPageSize, activeEnrollments, firstRowIndex]);

  if (isLoading) return <DataTableSkeleton role="progressbar" rowCount={programsToShowCount} />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;
  if (activeEnrollments?.length) {
    return (
      <div>
        <div className={styles.programsHeader}>
          <h4 className={`${styles.productiveHeading03} ${styles.text02}`}>{headerTitle}</h4>
          <Button kind="ghost" renderIcon={Add16} iconDescription="Add programs" onClick={launchProgramsForm}>
            {t('add', 'Add')}
          </Button>
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
        </TableContainer>
        {activeEnrollments.length > programsToShowCount && (
          <Pagination
            totalItems={activeEnrollments.length}
            backwardText={previousPage}
            forwardText={nextPage}
            pageSize={currentPageSize}
            pageSizes={[5, 10, 15, 25]}
            itemsPerPageText={itemsPerPage}
            onChange={({ page, pageSize }) => {
              if (pageSize !== currentPageSize) {
                setCurrentPageSize(pageSize);
              }
              setFirstRowIndex(pageSize * (page - 1));
            }}
          />
        )}
      </div>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchProgramsForm} />;
};

export default ProgramsOverview;
