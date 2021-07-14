import React from 'react';
import Tag from 'carbon-components-react/es/components/Tag';
import TooltipDefinition from 'carbon-components-react/es/components/TooltipDefinition';
import dayjs from 'dayjs';
import styles from './active-visit-tag.scss';
import { useVisit } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';

function ActiveVisitBannerTag({ patientUuid }) {
  const currentVisit = useVisit(patientUuid);
  const { t } = useTranslation();

  return (
    currentVisit && (
      <TooltipDefinition
        align="end"
        tooltipText={
          <div className={styles.tooltipPadding}>
            <h6 style={{ marginBottom: '0.5rem' }}>
              {currentVisit && currentVisit.visitType && currentVisit.visitType.name}
            </h6>
            <span>
              <span className={styles.tooltipSmallText}>Started: </span>
              <span>{dayjs(currentVisit && currentVisit.startDatetime).format('DD - MMM - YYYY @ HH:mm')}</span>
            </span>
          </div>
        }>
        <Tag type="blue">{t('activeVisit', 'Active Visit')}</Tag>
      </TooltipDefinition>
    )
  );
}

export default ActiveVisitBannerTag;
