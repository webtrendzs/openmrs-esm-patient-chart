import React from 'react';
import OrderBasket from '../order-basket/order-basket.component';
import { Provider } from 'unistore/react';
import { orderBasketStore } from './order-basket-store';

interface DefaultWorkspaceProps {
  patientUuid: string;
  closeWorkspace: () => {}
}

export default function RootOrderBasket({ patientUuid, closeWorkspace }: DefaultWorkspaceProps) {
  return (
    <Provider store={orderBasketStore}>
      <OrderBasket patientUuid={patientUuid} closeWorkspace={closeWorkspace} />
    </Provider>
  );
}
