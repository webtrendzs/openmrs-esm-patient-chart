import React from 'react';
import { Provider } from 'unistore/react';
import { orderBasketStore } from '../medications/order-basket-store';
import { DefaultWorkspaceProps } from '@openmrs/esm-patient-common-lib';
import PrescribedMedicationsForm from '../medications/prescribed-medications.form';

export default function PrescriptionOrderForm({ patientUuid, closeWorkspace }: DefaultWorkspaceProps) {
  return (
    <Provider store={orderBasketStore}>
      <PrescribedMedicationsForm patientUuid={patientUuid} closeWorkspace={closeWorkspace} />
    </Provider>
  );
}
