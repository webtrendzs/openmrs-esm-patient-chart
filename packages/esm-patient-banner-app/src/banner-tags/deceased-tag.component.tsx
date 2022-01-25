import React from 'react';
import styles from './active-visit-tag.scss';
import { useTranslation } from 'react-i18next';
import { Tag, TooltipDefinition } from 'carbon-components-react';
import { formatDatetime } from '@openmrs/esm-framework';

interface DecasedBannerTagProps {
  patient: fhir.Patient;
}
const DeceasedBannerTag: React.FC<DecasedBannerTagProps> = ({ patient }) => {
  const { t } = useTranslation();
  return patient.deceasedDateTime ? (
    <TooltipDefinition
      align="end"
      tooltipText={
        <div className={styles.tooltipPadding}>
          <h6 style={{ marginBottom: '0.5rem' }}>{t('deceased', 'Deceased')}</h6>
          <span>{formatDatetime(new Date(patient.deceasedDateTime))}</span>
        </div>
      }
    >
      <Tag type="red">{t('deceased', 'Deceased')}</Tag>
    </TooltipDefinition>
  ) : null;
};

export default DeceasedBannerTag;
