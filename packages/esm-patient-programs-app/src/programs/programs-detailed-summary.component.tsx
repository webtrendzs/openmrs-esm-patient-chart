import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { attach } from '@openmrs/esm-framework';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import Add16 from '@carbon/icons-react/es/add/16';
import Button from 'carbon-components-react/es/components/Button';
import DataTableSkeleton from 'carbon-components-react/lib/components/DataTableSkeleton/DataTableSkeleton';
import DataTable, {
  Table,
  TableCell,
  TableContainer,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from 'carbon-components-react/es/components/DataTable';
import { useProgramEnrollments } from './programs.resource';
import { useProgramsContext } from './programs.context';
import styles from './programs-detailed-summary.scss';
import { PatientProgram } from '../types';

const ProgramsDetailedSummary: React.FC = () => {
  const { t } = useTranslation();
  const displayText = t('programEnrollments', 'Program enrollments');
  const headerTitle = t('carePrograms', 'Care Programs');

  const { patientUuid } = useProgramsContext();
  const { data: programEnrollments, isError, isLoading } = useProgramEnrollments(patientUuid);

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
      {
        key: 'status',
        header: t('status', 'Status'),
      },
    ],
    [t],
  );

  const tableRows: Array<PatientProgram> = React.useMemo(() => {
    return programEnrollments?.map((program) => {
      return {
        ...program,
        id: program.uuid,
        dateEnrolled: dayjs(program.dateEnrolled).format('MMM-YYYY'),
        status: program.dateCompleted
          ? `${t('completedOn', 'Completed On')} ${dayjs(program.dateCompleted).format('MMM-YYYY')}`
          : t('active', 'Active'),
      };
    });
  }, [programEnrollments, t]);

  if (isLoading) return <DataTableSkeleton role="progressbar" />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;
  if (programEnrollments?.length) {
    return (
      <>
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
      </>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchProgramsForm} />;
};

export default ProgramsDetailedSummary;
