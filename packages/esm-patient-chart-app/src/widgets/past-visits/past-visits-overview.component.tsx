import React from 'react';
import { useTranslation } from 'react-i18next';
import { createErrorHandler } from '@openmrs/esm-framework';
import { Column, Grid, Row } from 'carbon-components-react/es/components/Grid';
import Button from 'carbon-components-react/es/components/Button';
import DataTableSkeleton from 'carbon-components-react/es/components/DataTableSkeleton';
import DataTable, {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableExpandHeader,
  TableExpandRow,
  TableExpandedRow,
  TableHead,
  TableHeader,
  TableRow,
} from 'carbon-components-react/es/components/DataTable';
import Tag from 'carbon-components-react/es/components/Tag';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { fetchPastVisits, MappedVisit } from './past-visits.resource';
import styles from './past-visits-overview.scss';

const pastVisitsToShowCount = 5;

enum StateTypes {
  LOADING,
  RESOLVED,
  REJECTED,
}

interface PastVisitsOverviewProps {
  patientUuid: string;
}

interface LoadingState {
  isLoading: boolean;
  type: StateTypes.LOADING;
}

interface ResolvedState {
  pastVisits: Array<MappedVisit>;
  isLoading: boolean;
  type: StateTypes.RESOLVED;
}

interface RejectedState {
  error: Error | undefined;
  hasError: boolean;
}

type ViewState = LoadingState | ResolvedState | RejectedState;

const PastVisitsOverview: React.FC<PastVisitsOverviewProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const headerTitle = t('pastVisits', 'Past Visits');
  const displayText = t('pastVisits', 'Past Visits');
  const [showAllPastVisits, setShowAllPastVisits] = React.useState(false);
  const [viewState, setViewState] = React.useState<ViewState>({
    isLoading: false,
    type: StateTypes.LOADING,
  });

  React.useEffect(() => {
    if (patientUuid) {
      const abortController = new AbortController();
      const sub = fetchPastVisits(patientUuid, abortController).subscribe(
        (pastVisits: Array<MappedVisit>) =>
          setViewState((state) => ({
            ...state,
            isLoading: false,
            pastVisits: pastVisits,
            type: StateTypes.RESOLVED,
          })),
        (error) => {
          createErrorHandler();
          setViewState((state) => ({
            ...state,
            hasError: true,
            error: error,
            type: StateTypes.REJECTED,
          }));
        },
        () => sub.unsubscribe(),
      );
    }
  }, [patientUuid]);

  const headers = [
    {
      key: 'startDate',
      header: t('date', 'Date'),
    },
    {
      key: 'startTime',
      header: t('time', 'Time'),
    },
    {
      key: 'location',
      header: t('location', 'Location'),
    },
    {
      key: 'visitType',
      header: t('visitType', 'Visit Type'),
    },
  ];

  const getRowItems = (rows: Array<MappedVisit>) => {
    return rows?.slice(0, showAllPastVisits ? rows.length : pastVisitsToShowCount).map((row) => {
      return {
        ...row,
        isExpanded: row.obs.length ? true : false,
      };
    });
  };

  const toggleShowAllPastVisits = () => {
    setShowAllPastVisits(!showAllPastVisits);
  };

  return (
    <div>
      {(() => {
        if ((viewState as LoadingState).isLoading) return <DataTableSkeleton rowCount={3} />;

        if ((viewState as RejectedState).hasError)
          return <ErrorState error={(viewState as RejectedState).error} headerTitle={headerTitle} />;

        if ((viewState as ResolvedState).pastVisits && (viewState as ResolvedState).pastVisits.length === 0)
          return <EmptyState headerTitle={headerTitle} displayText={displayText} />;

        if ((viewState as ResolvedState).pastVisits) {
          return (
            <>
              <div className={styles.pastVisitsOverviewHeader}>
                <h4 className={styles.productiveHeading03}>{headerTitle}</h4>
              </div>
              <TableContainer>
                <DataTable
                  rows={getRowItems((viewState as ResolvedState).pastVisits)}
                  headers={headers}
                  isSortable={true}
                  size="short">
                  {({ rows, headers, getHeaderProps, getTableProps, getRowProps }) => (
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          <TableExpandHeader />
                          {headers.map((header, i) => (
                            <TableHeader
                              key={i}
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
                        {rows.map((row, i) => {
                          return (
                            <React.Fragment key={row.id}>
                              <TableExpandRow {...getRowProps({ row })}>
                                {row.cells.map((cell) => (
                                  <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
                                ))}
                              </TableExpandRow>
                              {row.isExpanded && (
                                <TableExpandedRow className={styles.expandedObsPanel} colSpan={headers.length + 1}>
                                  <Grid style={{ margin: '0rem', padding: '0rem', maxWidth: '100%' }}>
                                    {(viewState as ResolvedState).pastVisits[i].obs.length > 0 &&
                                      (viewState as ResolvedState).pastVisits[i].obs?.map((observation, i) => (
                                        <React.Fragment key={i}>
                                          {observation[0]?.display.match(/^Visit Diagnoses/i) && (
                                            <Row style={{ margin: '1rem' }}>
                                              <Column
                                                sm={1}
                                                md={2}
                                                lg={3}
                                                xlg={3}
                                                style={{
                                                  padding: '0rem',
                                                }}>
                                                <span className={styles.obsLabel}>{t('diagnosis', 'Diagnosis')}</span>
                                              </Column>
                                              <Column
                                                sm={2}
                                                md={5}
                                                lg={7}
                                                xlg={7}
                                                style={{
                                                  padding: '0rem',
                                                }}>
                                                <Tag
                                                  className={styles.diagnosisTag}
                                                  key={i}
                                                  style={{ margin: '0rem 1rem' }}
                                                  type={observation[0]?.display.match(/primary/i) ? 'red' : 'blue'}>
                                                  {observation[0]?.display
                                                    .replace(
                                                      /primary|secondary|presumed|diagnosis|confirmed|:|visit|diagnoses|,|}/gi,
                                                      '',
                                                    )
                                                    .trim()}
                                                </Tag>
                                              </Column>
                                            </Row>
                                          )}
                                          {observation[0]?.display.match(/text of encounter note/gi) && (
                                            <Row style={{ margin: '1rem' }}>
                                              <Column sm={1} md={2} lg={3} xlg={3} style={{ padding: '0rem' }}>
                                                <span className={styles.obsLabel}>{t('note', 'Note')}</span>
                                              </Column>
                                              <Column
                                                sm={2}
                                                md={5}
                                                lg={7}
                                                xlg={7}
                                                style={{
                                                  padding: '0rem',
                                                }}>
                                                <span style={{ margin: '0rem 1rem' }} className={styles.noteText}>
                                                  {observation[0]?.display.substr(24)}
                                                </span>
                                              </Column>
                                            </Row>
                                          )}
                                          {observation[0]?.display.match(/vitals/gi) && (
                                            <Row style={{ margin: '1rem' }}>
                                              <Column sm={1} md={2} lg={3} xlg={3} style={{ padding: '0rem' }}>
                                                <span className={styles.obsLabel}>{t('vitals', 'Vitals')}</span>
                                              </Column>
                                              <Column
                                                sm={2}
                                                md={5}
                                                lg={7}
                                                xlg={7}
                                                style={{
                                                  padding: '0rem',
                                                }}>
                                                <span style={{ margin: '0rem 1rem' }}>
                                                  {observation[0]?.display ? observation[0]?.display.substr(13) : ''}
                                                </span>
                                              </Column>
                                            </Row>
                                          )}
                                        </React.Fragment>
                                      ))}
                                  </Grid>
                                </TableExpandedRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {!showAllPastVisits && (viewState as ResolvedState).pastVisits.length > pastVisitsToShowCount && (
                          <TableRow>
                            <TableCell colSpan={4}>
                              <span style={{ display: 'inline-block', margin: '0.45rem 0rem' }}>
                                {`${pastVisitsToShowCount} / ${(viewState as ResolvedState).pastVisits.length}`}{' '}
                                {t('items', 'items')}
                              </span>
                              <Button size="small" kind="ghost" onClick={toggleShowAllPastVisits}>
                                {t('seeAll', 'See all')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </DataTable>
              </TableContainer>
            </>
          );
        }
      })()}
    </div>
  );
};

export default PastVisitsOverview;
