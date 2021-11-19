import React, { useCallback } from 'react';
import Table16 from '@carbon/icons-react/es/table/16';
import ChartLine16 from '@carbon/icons-react/es/chart--line/16';
import { Button, TableToolbarContent, TableToolbar } from 'carbon-components-react';
import { EmptyState } from '@openmrs/esm-patient-common-lib';
import { Card, headers, formatDate, InfoButton, Separator } from './helpers';
import { OverviewPanelEntry } from '../resources/useOverviewData';
import { useTranslation } from 'react-i18next';
import { navigate } from '@openmrs/esm-framework';
import CommonDataTable from './common-datatable.component';
import styles from './common-overview.scss';

const DashboardResultsCount = 5;

interface CommonOverviewPropsBase {
  overviewData: Array<OverviewPanelEntry>;
  insertSeparator?: boolean;
  isPatientSummaryDashboard?: boolean;
  patientUuid?: string;
}

interface CommonOverviewPropsWithToolbar {
  openTimeline: (panelUuid: string) => void;
  openTrendline: (panelUuid: string, testUuid: string) => void;
}

interface CommonOverviewPropsWithoutToolbar {
  deactivateToolbar: true;
}

type Only<T, U> = {
  [P in keyof T]: T[P];
} & {
  [P in keyof U]?: never;
};

type Either<T, U> = Only<T, U> | Only<U, T>;

type CommonOverviewProps = CommonOverviewPropsBase &
  Either<CommonOverviewPropsWithToolbar, CommonOverviewPropsWithoutToolbar>;

const CommonOverview: React.FC<CommonOverviewProps> = ({
  overviewData = [],
  insertSeparator = false,
  openTimeline,
  openTrendline,
  deactivateToolbar = false,
  isPatientSummaryDashboard,
  patientUuid,
}) => {
  const { t } = useTranslation();
  const abnormalInterpretations = [
    'LOW',
    'HIGH',
    'CRITICALLY_LOW',
    'CRITICALLY_HIGH',
    'OFF_SCALE_LOW',
    'OFF_SCALE_HIGH',
  ];

  const handleSeeAvailableResults = useCallback(() => {
    navigate({ to: `\${openmrsSpaBase}/patient/${patientUuid}/chart/test-results` });
  }, [patientUuid]);

  if (!overviewData.length)
    return <EmptyState headerTitle={t('testResults', 'Test Results')} displayText={t('testResults', 'test results')} />;

  return (
    <>
      {(() => {
        const cards = overviewData.map(([title, type, data, date, uuid]) => {
          const allNormalResults = !data.some((result) => abnormalInterpretations.includes(result.interpretation));
          const patientSummaryDashboardData = data.slice(0, DashboardResultsCount);
          return (
            <Card allNormalResults={allNormalResults} key={uuid}>
              <CommonDataTable
                {...{
                  title,
                  data: isPatientSummaryDashboard ? patientSummaryDashboardData : data,
                  tableHeaders: headers,
                  description: (
                    <div>
                      {formatDate(date)}
                      <InfoButton />
                    </div>
                  ),
                  toolbar: deactivateToolbar || (
                    <TableToolbar>
                      <TableToolbarContent>
                        {type === 'Test' && (
                          <Button kind="ghost" renderIcon={ChartLine16} onClick={() => openTrendline(uuid, uuid)}>
                            {t('trend', 'Trend')}
                          </Button>
                        )}
                        <Button kind="ghost" renderIcon={Table16} onClick={() => openTimeline(uuid)}>
                          {t('timeline', 'Timeline')}
                        </Button>
                      </TableToolbarContent>
                    </TableToolbar>
                  ),
                }}
              />
              {data.length > DashboardResultsCount && isPatientSummaryDashboard && (
                <Button onClick={handleSeeAvailableResults} kind="ghost">
                  {t('moreResultsAvailable', 'More results available')}
                </Button>
              )}
            </Card>
          );
        });

        if (insertSeparator)
          return cards.reduce((acc, val, i, { length }) => {
            acc.push(val);

            if (i < length - 1) {
              acc.push(<Separator key={i} />);
            }

            return acc;
          }, []);

        return cards;
      })()}
    </>
  );
};

export default CommonOverview;
