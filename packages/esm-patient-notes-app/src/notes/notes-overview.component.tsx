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
import { EmptyState, ErrorState, launchStartVisitPrompt } from '@openmrs/esm-patient-common-lib';
import { attach, useVisit } from '@openmrs/esm-framework';
import { useEncounters } from './encounter.resource';
import { formatNotesDate } from './notes-helper';
import styles from './notes-overview.scss';
import { Encounter } from '../types';
const notesToShowCount = 5;

interface NotesOverviewProps {
  patientUuid: string;
  showAddNote: boolean;
}

const NotesOverview: React.FC<NotesOverviewProps> = ({ patientUuid, showAddNote }) => {
  const { t } = useTranslation();
  const { currentVisit } = useVisit(patientUuid);
  const { data: encounters, isLoading, isError } = useEncounters(patientUuid);
  const [firstRowIndex, setFirstRowIndex] = React.useState(0);
  const [currentPageSize, setCurrentPageSize] = React.useState(5);

  const displayText = t('notes', 'Notes');
  const headerTitle = t('notes', 'Notes');
  const nextPage = t('nextPage', 'Next Page');
  const itemPerPage = t('itemPerPage', 'Item per page');
  const previousPage = t('previousPage', 'Previous page');

  const launchVisitNotesForm = React.useCallback(() => {
    if (currentVisit) {
      attach('patient-chart-workspace-slot', 'visit-notes-workspace');
    } else {
      launchStartVisitPrompt();
    }
  }, [currentVisit]);

  const tableHeaders = React.useMemo(
    () => [
      {
        key: 'encounterDate',
        header: t('date', 'Date'),
      },
      {
        key: 'encounterType',
        header: t('encounterType', 'Encounter type'),
      },
      {
        key: 'encounterLocation',
        header: t('location', 'Location'),
      },
      {
        key: 'encounterAuthor',
        header: t('author', 'Author'),
      },
    ],
    [t],
  );

  const tableRows: Array<Encounter> = React.useMemo(() => {
    return encounters?.slice(firstRowIndex, firstRowIndex + currentPageSize)?.map((encounter) => ({
      ...encounter,
      encounterDate: formatNotesDate(encounter.encounterDate),
      author: encounter.encounterAuthor ? encounter.encounterAuthor : '\u2014',
    }));
  }, [currentPageSize, encounters, firstRowIndex]);

  if (isLoading) return <DataTableSkeleton role="progressbar" />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;
  if (encounters?.length) {
    return (
      <>
        <div className={styles.notesHeader}>
          <h4 className={`${styles.productiveHeading03} ${styles.text02}`}>{headerTitle}</h4>
          {showAddNote && (
            <Button kind="ghost" renderIcon={Add16} iconDescription="Add visit note" onClick={launchVisitNotesForm}>
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
          {encounters.length > notesToShowCount && (
            <Pagination
              totalItems={encounters.length}
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
      </>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchVisitNotesForm} />;
};

export default NotesOverview;
