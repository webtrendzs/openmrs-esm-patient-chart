import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import isEmpty from 'lodash-es/isEmpty';
import InlineLoading from 'carbon-components-react/es/components/InlineLoading';
import VitalHeaderStateDetails from './vital-header-details.component';
import VitalsHeaderStateTitle from './vital-header-title.component';
import { useConfig, createErrorHandler } from '@openmrs/esm-framework';
import { PatientVitals, performPatientsVitalsSearch, useVitalsConceptMetadata } from '../vitals.resource';
import styles from './vital-header-state.component.scss';

interface ViewState {
  view: 'Default' | 'Warning';
}

interface VitalHeaderProps {
  patientUuid: string;
  showRecordVitals: boolean;
}

const VitalHeader: React.FC<VitalHeaderProps> = ({ patientUuid, showRecordVitals }) => {
  const { t } = useTranslation();
  const config = useConfig();
  const [vital, setVital] = useState<PatientVitals>();
  const [displayState, setDisplayState] = useState<ViewState>({
    view: 'Default',
  });
  const { data: conceptData } = useVitalsConceptMetadata();
  const conceptUnits = conceptData ? conceptData.conceptUnits : null;
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toggleView = () => setShowDetails((prevState) => !prevState);
  const cls = displayState.view === 'Warning' ? styles.warningBackground : styles.defaultBackground;

  useEffect(() => {
    if (patientUuid) {
      const subscription = performPatientsVitalsSearch(config.concepts, patientUuid, 10).subscribe((vitals) => {
        setVital(vitals[0]);
        setIsLoading(false);
      }, createErrorHandler);
      return () => subscription.unsubscribe();
    }
  }, [patientUuid, config.concepts]);

  useEffect(() => {
    if (vital && !dayjs(vital.date).isToday()) {
      setDisplayState({ view: 'Warning' });
    }

    if (!isLoading && isEmpty(vital)) {
      setDisplayState({ view: 'Warning' });
    }
  }, [vital, isLoading]);

  return (
    <>
      {!isLoading ? (
        <div className={`${cls} ${styles.vitalHeaderStateContainer}`}>
          <VitalsHeaderStateTitle
            toggleView={toggleView}
            showDetails={showDetails}
            view={displayState.view}
            vitals={vital}
            showRecordVitals={showRecordVitals}
          />
          {showDetails && (
            <div>
              <div className={styles.row}>
                <VitalHeaderStateDetails
                  unitName={t('temperatureAbbreviated', 'Temp')}
                  unitSymbol={conceptUnits ? conceptUnits[2] : ''}
                  value={vital.temperature}
                />
                <VitalHeaderStateDetails
                  unitName={t('bp', 'BP')}
                  unitSymbol={conceptUnits ? conceptUnits[0] : ''}
                  value={`${vital.systolic} / ${vital.diastolic}`}
                />
                <VitalHeaderStateDetails
                  unitName={t('heartRate', 'Heart Rate')}
                  unitSymbol={conceptUnits ? conceptUnits[5] : ''}
                  value={vital.pulse}
                />
                <VitalHeaderStateDetails
                  unitName={t('spo2', 'SpO2')}
                  unitSymbol={conceptUnits ? conceptUnits[6] : ''}
                  value={vital.oxygenSaturation}
                />
              </div>
              <div className={styles.row}>
                <VitalHeaderStateDetails
                  unitName={t('respiratoryRate', 'R. Rate')}
                  unitSymbol={conceptUnits ? conceptUnits[8] : ''}
                  value={vital.respiratoryRate}
                />
                <VitalHeaderStateDetails
                  unitName={t('height', 'Height')}
                  unitSymbol={conceptUnits ? conceptUnits[3] : ''}
                  value={vital.height}
                />
                <VitalHeaderStateDetails
                  unitName={t('bmi', 'BMI')}
                  unitSymbol={config.biometrics['bmiUnit']}
                  value={vital.bmi}
                />
                <VitalHeaderStateDetails
                  unitName={t('weight', 'Weight')}
                  unitSymbol={conceptUnits ? conceptUnits[4] : ''}
                  value={vital.weight}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <InlineLoading className={styles.loading} description={`${t('loading', 'Loading')} ...`} />
      )}
    </>
  );
};

export default VitalHeader;
