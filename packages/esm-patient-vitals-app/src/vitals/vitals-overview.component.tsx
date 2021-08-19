import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
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
import { attach } from '@openmrs/esm-framework';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import VitalsChart from './vitals-chart.component';
import { useVitals, useVitalsConceptMetadata, withUnit } from './vitals.resource';
import { patientVitalsBiometricsFormWorkspace } from '../constants';
import styles from './vitals-overview.scss';
const vitalsToShowCount = 5;

interface VitalsOverviewProps {
  patientUuid: string;
  showAddVitals: boolean;
}

const VitalsOverview: React.FC<VitalsOverviewProps> = ({ patientUuid, showAddVitals }) => {
  const { t } = useTranslation();
  const headerTitle = t('vitals', 'Vitals');
  const displayText = t('vitalSigns', 'Vital signs');
  const previousPage = t('previousPage', 'Previous page');
  const nextPage = t('nextPage', 'Next Page');
  const itemPerPage = t('itemPerPage', 'Item per page');

  const { data: vitals, isError, isLoading } = useVitals(patientUuid);
  const { data: conceptData } = useVitalsConceptMetadata();
  const conceptUnits = conceptData ? conceptData.conceptUnits : null;

  const [firstRowIndex, setFirstRowIndex] = React.useState(0);
  const [currentPageSize, setCurrentPageSize] = React.useState(5);
  const [chartView, setChartView] = React.useState(false);

  const launchVitalsBiometricsForm = React.useCallback(
    () => attach('patient-chart-workspace-slot', patientVitalsBiometricsFormWorkspace),
    [],
  );

  const tableHeaders = React.useMemo(
    () => [
      { key: 'date', header: 'Date', isSortable: true },
      {
        key: 'bloodPressure',
        header: withUnit('BP', conceptUnits ? conceptUnits[0] : ''),
      },
      {
        key: 'respiratoryRate',
        header: withUnit('R. Rate', conceptUnits ? conceptUnits[8] : ''),
      },
      { key: 'pulse', header: withUnit('Pulse', conceptUnits ? conceptUnits[5] : '') },
      {
        key: 'spo2',
        header: withUnit('SPO2', conceptUnits ? conceptUnits[6] : ''),
      },
      {
        key: 'temperature',
        header: withUnit('Temp', conceptUnits ? conceptUnits[2] : ''),
      },
    ],
    [conceptUnits],
  );

  const tableRows = React.useMemo(
    () =>
      vitals?.slice(firstRowIndex, firstRowIndex + currentPageSize).map((vital, index) => {
        return {
          id: `${index}`,
          date: dayjs(vital.date).format(`DD - MMM - YYYY`),
          bloodPressure: `${vital.systolic ?? '-'} / ${vital.diastolic ?? '-'}`,
          pulse: vital.pulse,
          spo2: vital.oxygenSaturation,
          temperature: vital.temperature,
          respiratoryRate: vital.respiratoryRate,
        };
      }),
    [vitals, firstRowIndex, currentPageSize],
  );

  if (isLoading) return <DataTableSkeleton role="progressbar" rowCount={vitalsToShowCount} />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;
  if (vitals?.length) {
    return (
      <div className={styles.vitalsWidgetContainer}>
        <div className={styles.vitalsHeaderContainer}>
          <h4 className={`${styles.productiveHeading03} ${styles.text02}`}>{headerTitle}</h4>
          <div className={styles.toggleButtons}>
            <Button
              className={styles.toggle}
              size="field"
              kind={chartView ? 'ghost' : 'secondary'}
              hasIconOnly
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
          {showAddVitals && (
            <Button kind="ghost" renderIcon={Add16} iconDescription="Add vitals" onClick={launchVitalsBiometricsForm}>
              {t('add', 'Add')}
            </Button>
          )}
        </div>
        {chartView && vitals.length ? (
          <VitalsChart patientVitals={vitals} conceptsUnits={conceptUnits} />
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
            {vitals?.length > vitalsToShowCount && (
              <Pagination
                totalItems={vitals?.length}
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
  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchVitalsBiometricsForm} />;
};

export default VitalsOverview;
