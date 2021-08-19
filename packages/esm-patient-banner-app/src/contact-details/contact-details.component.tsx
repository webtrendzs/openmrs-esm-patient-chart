import React from 'react';
import { useTranslation } from 'react-i18next';
import InlineLoading from 'carbon-components-react/es/components/InlineLoading';
import { useRelationships } from './relationships.resource';
import styles from './contact-details.scss';

const Address: React.FC<{ address: fhir.Address }> = ({ address }) => {
  const { t } = useTranslation();
  const { city, country, postalCode, state } = address;
  return (
    <div className={styles.col}>
      <p className={styles.heading}>{t('address', 'Address')}</p>
      <ul>
        <li>{postalCode}</li>
        <li>{city}</li>
        <li>{state}</li>
        <li>{country}</li>
      </ul>
    </div>
  );
};

const Contact: React.FC<{ telecom: Array<fhir.ContactPoint> }> = ({ telecom }) => {
  const { t } = useTranslation();
  const value = telecom ? telecom[0].value : '-';

  return (
    <div className={styles.col}>
      <p className={styles.heading}>{t('contactDetails', 'Contact Details')}</p>
      <ul>
        <li>{value}</li>
      </ul>
    </div>
  );
};

const Relationships: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { data: relationships, isLoading, isError } = useRelationships(patientId);

  return (
    <div className={styles.col}>
      <p className={styles.heading}>Relationships</p>
      {isLoading ? <InlineLoading role="progressbar" description="Loading..." /> : null}
      {isError ? <p>There was an error fetching relationships</p> : null}
      {relationships?.length ? (
        <ul style={{ width: '50%' }}>
          {relationships.map((r) => (
            <li key={r.uuid} className={styles.relationship}>
              <div>{r.display}</div>
              <div>{r.relationshipType}</div>
              <div>{`${r.relativeAge} ${r.relativeAge === 1 ? 'yr' : 'yrs'}`}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

interface ContactDetailsProps {
  address: Array<fhir.Address>;
  telecom: Array<fhir.ContactPoint>;
  patientId: string;
}

const ContactDetails: React.FC<ContactDetailsProps> = ({ address, telecom, patientId }) => {
  const currentAddress = address.find((a) => a.use === 'home');

  return (
    <div className={styles.contactDetails}>
      <div className={styles.row}>
        <Address address={currentAddress} />
        <Contact telecom={telecom} />
      </div>
      <div className={styles.row}>
        <Relationships patientId={patientId} />
      </div>
    </div>
  );
};

export default ContactDetails;
