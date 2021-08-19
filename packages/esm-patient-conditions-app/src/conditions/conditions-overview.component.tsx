import React from 'react';
import dayjs from 'dayjs';
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
import { attach } from '@openmrs/esm-framework';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { useConditions } from './conditions.resource';
import { Condition } from '../types';
import styles from './conditions-overview.scss';
const conditionsToShowCount = 5;

interface ConditionsOverviewProps {
  basePath: string;
  patient: fhir.Patient;
}

const ConditionsOverview: React.FC<ConditionsOverviewProps> = ({ patient }) => {
  const { t } = useTranslation();
  const displayText = t('conditions', 'Conditions');
  const headerTitle = t('conditions', 'Conditions');
  const previousPage = t('previousPage', 'Previous page');
  const nextPage = t('nextPage', 'Next Page');
  const itemPerPage = t('itemPerPage', 'Item per page');

  const [firstRowIndex, setFirstRowIndex] = React.useState(0);
  const [currentPageSize, setCurrentPageSize] = React.useState(5);
  const { data: conditions, isError, isLoading } = useConditions(patient.identifier[0].value);

  const launchConditionsForm = React.useCallback(
    () => attach('patient-chart-workspace-slot', 'conditions-form-workspace'),
    [],
  );

  const tableHeaders = React.useMemo(
    () => [
      {
        key: 'display',
        header: t('activeConditions', 'Active Conditions'),
      },
      {
        key: 'onsetDateTime',
        header: t('since', 'Since'),
      },
    ],
    [t],
  );

  const tableRows: Array<Condition> = React.useMemo(() => {
    return conditions?.slice(firstRowIndex, firstRowIndex + currentPageSize)?.map((condition) => ({
      ...condition,
      onsetDateTime: dayjs(condition.onsetDateTime).format('MMM-YYYY'),
    }));
  }, [currentPageSize, conditions, firstRowIndex]);

  if (isLoading) return <DataTableSkeleton role="progressbar" rowCount={conditionsToShowCount} />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;
  if (conditions?.length) {
    return (
      <>
        <div>
          <div className={styles.conditionsHeader}>
            <h4 className={`${styles.productiveHeading03} ${styles.text02}`}>{headerTitle}</h4>
            <Button kind="ghost" renderIcon={Add16} iconDescription="Add conditions" onClick={launchConditionsForm}>
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
          {conditions.length > conditionsToShowCount && (
            <Pagination
              totalItems={conditions.length}
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
        </div>
      </>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchConditionsForm} />;
};

export default ConditionsOverview;
