import { createErrorHandler, formatDate } from '@openmrs/esm-framework';
import { InlineLoading } from 'carbon-components-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPatientHTNEncounters } from '../api/api';
import { HTNEncounters } from '../constants';
import { pickValidEncounter } from '../utils/general';

import styles from './peer-info-header.scss';
import { extractEncounterMedData } from './prescribed-medications';

interface PeerInfoHeaderProps {
  patientUuid: string;
  showRecordVitalsButton: boolean;
}

const PeerInfoHeader: React.FC<PeerInfoHeaderProps> = ({ patientUuid }) => {
  const { t } = useTranslation();

  const [encounter, setEncounter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nhifStatus, setNhifStatus] = useState(null);
  const [rtcDate, setRtcDate] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    if(encounter) {
      const encounterData = extractEncounterMedData(encounter.obs);
      setNhifStatus(encounterData['NHIF STATUS'][0]);
      setRtcDate(encounterData['RETURN VISIT DATE'][0]);
    } else {
      
      const patientEncounterRequest = getPatientHTNEncounters(patientUuid, HTNEncounters, abortController).then(
        (data) => {
          console.log("getPatientHTNEncounters", pickValidEncounter(data));
          setEncounter(pickValidEncounter(data));
        },
        createErrorHandler,
      );
  
      Promise.all([patientEncounterRequest]).finally(() => setIsLoading(false));
      return () => abortController.abort();
    } 

  }, [patientUuid, encounter]);
  if(!nhifStatus) 
    return(<></>)
  return (
    <div className={styles['vitals-header']}>
      <span className={styles.container}>
        <span className={styles.heading}>{t('peerEncounterInfo', 'Peer Encounter Info:')}</span>
        {
          isLoading ? (
            <span>
              <InlineLoading />
            </span>
          ) : (
            <span>NHIF Status: <strong>{nhifStatus.value.display}</strong> / Next RTC Date: <strong>{formatDate(new Date(rtcDate.value))}</strong></span>
          )
        }
        
      </span>
    </div>
  );
};

export default PeerInfoHeader;