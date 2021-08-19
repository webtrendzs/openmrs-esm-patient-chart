import React from 'react';
import dayjs from 'dayjs';
import Add16 from '@carbon/icons-react/es/add/16';
import ChartLineSmooth16 from '@carbon/icons-react/es/chart--line-smooth/16';
import Table16 from '@carbon/icons-react/es/table/16';
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
import Pagination from 'carbon-components-react/lib/components/Pagination';
import BiometricsChart from './biometrics-chart.component';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { attach, useConfig } from '@openmrs/esm-framework';
import { useBiometrics, useBiometricsConceptMetadata } from './biometrics.resource';
import { ConfigObject } from '../config-schema';
import { patientVitalsBiometricsFormWorkspace } from '../constants';
import styles from './biometrics-overview.scss';
const biometricsToShowCount = 5;

export interface PatientBiometrics {
  id: string;
  date: string;
  weight: number;
  height: number;
  bmi: string;
}

interface BiometricsOverviewProps {
  patientUuid: string;
  showAddBiometrics: boolean;
}

const BiometricsOverview: React.FC<BiometricsOverviewProps> = ({ patientUuid, showAddBiometrics }) => {
  const { t } = useTranslation();
  const config = useConfig() as ConfigObject;
  const { bmiUnit } = config.biometrics;

  const displayText = t('biometrics', 'biometrics');
  const headerTitle = t('biometrics', 'Biometrics');
  const previousPage = t('previousPage', 'Previous page');
  const nextPage = t('nextPage', 'Next Page');
  const itemPerPage = t('itemPerPage', 'Item per page');

  const { data: dimensions, isLoading, isError } = useBiometrics(patientUuid);
  const { data: units } = useBiometricsConceptMetadata();
  const [firstRowIndex, setFirstRowIndex] = React.useState(0);
  const [currentPageSize, setCurrentPageSize] = React.useState(5);
  const [chartView, setChartView] = React.useState(false);

  const launchBiometricsForm = React.useCallback(() => {
    attach('patient-chart-workspace-slot', patientVitalsBiometricsFormWorkspace);
  }, []);

  const tableHeaders = React.useMemo(
    () => [
      { key: 'date', header: t('date', 'Date') },
      { key: 'weight', header: `Weight ${units ? `(${units[4]})` : ''}` },
      { key: 'height', header: `Height ${units ? `(${units[3]})` : ''}` },
      { key: 'bmi', header: `BMI (${bmiUnit})` },
    ],
    [bmiUnit, t, units],
  );

  const tableRows = React.useMemo(
    () =>
      dimensions?.slice(firstRowIndex, firstRowIndex + currentPageSize)?.map((dimension) => ({
        ...dimension,
        date: dayjs(dimension.date).format(`DD - MMM - YYYY`),
      })),
    [currentPageSize, dimensions, firstRowIndex],
  );

  if (isLoading) return <DataTableSkeleton role="progressbar" rowCount={biometricsToShowCount} />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;
  if (dimensions?.length) {
    return (
      <div className={styles.biometricsWidgetContainer}>
        <div className={styles.biometricsHeaderContainer}>
          <h4 className={`${styles.productiveHeading03} ${styles.text02}`}>{headerTitle}</h4>
          <div className={styles.toggleButtons}>
            <Button
              className={styles.toggle}
              size="field"
              hasIconOnly
              kind={chartView ? 'ghost' : 'secondary'}
              renderIcon={Table16}
              iconDescription={t('tableView', 'Table View')}
              onClick={() => setChartView(false)}
            />
            <Button
              className={styles.toggle}
              size="field"
              kind={chartView ? 'secondary' : 'ghost'}
              hasIconOnly
              renderIcon={ChartLineSmooth16}
              iconDescription={t('chartView', 'Chart View')}
              onClick={() => setChartView(true)}
            />
          </div>
          {showAddBiometrics && (
            <Button kind="ghost" renderIcon={Add16} iconDescription="Add biometrics" onClick={launchBiometricsForm}>
              {t('add', 'Add')}
            </Button>
          )}
        </div>
        {chartView ? (
          <BiometricsChart patientBiometrics={dimensions} conceptsUnits={units} />
        ) : (
          <>
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
            {dimensions?.length > biometricsToShowCount && (
              <Pagination
                totalItems={dimensions?.length}
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
          </>
        )}
      </div>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchBiometricsForm} />;
};

export default BiometricsOverview;
