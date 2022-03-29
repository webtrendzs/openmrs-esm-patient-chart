import React from 'react';
import MedicationsDetailsTable from '../components/medications-details-table.component';
import { useTranslation } from 'react-i18next';
import { Provider } from 'unistore/react';
import { orderBasketStore } from '../medications/order-basket-store';
import { DataTableSkeleton } from 'carbon-components-react';
import { EmptyState, ErrorState, launchPatientWorkspace } from '@openmrs/esm-patient-common-lib';
import { usePatientOrders } from '../api/api';
import PrescribedMedicationsTable from '../components/prescribed-medications-table';

interface ActivePrescriptionsProps {
  patientUuid: string;
}

const ActivePrescriptions: React.FC<ActivePrescriptionsProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const displayText = t('activePrescriptions', 'Active Prescriptions');
  const headerTitle = t('activePrescriptions', 'active Prescriptions');

  const launchOrderBasket = React.useCallback(() => {
    launchPatientWorkspace('order-basket-workspace');
  }, []);

  
    return (
      <Provider store={orderBasketStore}>
        <PrescribedMedicationsTable patientUuid={patientUuid}/>
      </Provider>
    );

  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchOrderBasket} />;
};

export default ActivePrescriptions;
