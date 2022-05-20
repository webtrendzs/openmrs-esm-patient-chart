import React from 'react';
import { Provider } from 'unistore/react';
import { orderBasketStore } from '../medications/order-basket-store';
import PrescribedMedicationsForm from '../medications/prescribed-medications.form';

interface DefaultWorkspaceProps {
  patientUuid: string;
  closeWorkspace: () => {}
}

export default function PrescriptionOrderForm({ patientUuid, closeWorkspace }: DefaultWorkspaceProps) {
  return (
    <Provider store={orderBasketStore}>
      <PrescribedMedicationsForm patientUuid={patientUuid} closeWorkspace={closeWorkspace} />
    </Provider>
  );
}
