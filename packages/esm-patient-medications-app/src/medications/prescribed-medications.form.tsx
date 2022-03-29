import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createErrorHandler, OpenmrsResource, showToast, useLayoutType, useSessionUser } from '@openmrs/esm-framework';
import { connect } from 'unistore/react';
import capitalize from 'lodash-es/capitalize';
import { Accordion, AccordionItem, Button, ButtonSet } from 'carbon-components-react';
import ArrowLeft24 from '@carbon/icons-react/es/arrow--left/24';

import { getDurationUnits } from '../api/api';
import { OrderBasketItem } from '../types/order-basket-item';
import MedicationOrderForm from '../order-basket/medication-order-form.component';
import { OrderBasketStore, orderBasketStoreActions, OrderBasketStoreActions } from './order-basket-store';
import { orderDrugs } from '../order-basket/drug-ordering';
import styles from '../order-basket/medication-order-form.scss';


interface PrescribedMedicationsFormProps {
  closeWorkspace(): void;
  patientUuid: string;
}

const PrescribedMedicationsForm = connect<PrescribedMedicationsFormProps, OrderBasketStoreActions, OrderBasketStore, {}>(
  'items',
  orderBasketStoreActions,
)(({ patientUuid, items, closeWorkspace, setItems }: PrescribedMedicationsFormProps & OrderBasketStore & OrderBasketStoreActions) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  
  const [durationUnits, setDurationUnits] = useState<Array<OpenmrsResource>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [medicationsForOrder, setMedicationsForOrder] = useState<Array<OrderBasketItem>>([]);

  useMemo(() => {
    const abortController = new AbortController();
    const durationUnitsRequest = getDurationUnits(abortController).then(
      (res) => {setDurationUnits(res.data.setMembers)},
      createErrorHandler,
    );
  
    Promise.all([durationUnitsRequest]).finally(() => setIsLoading(true));
    return () => abortController.abort();

  }, [items]);

  const sessionUser = useSessionUser();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (sessionUser) {
      setUser(sessionUser);
    }
  }, [sessionUser]);

  const handleCancelClicked = () => {
    setItems([]);
    closeWorkspace();
  };

  const handleSaveClicked = (order) => {
    console.log(medicationsForOrder);
    setMedicationsForOrder((existingOrders) => {
      return [...existingOrders, order];
    });
  };

  const closeItem = () => false;


  const handleOrderSubmitted = () => {
    const abortController = new AbortController();
    orderDrugs(user?.currentProvider?.uuid, medicationsForOrder, patientUuid, abortController).then((erroredItems) => {
      setItems(erroredItems);
      if (erroredItems.length == 0) {
        closeWorkspace();

        showToast({
          critical: true,
          kind: 'success',
          title: t('orderCompleted', 'Order placed'),
          description: t(
            'orderCompletedSuccessText',
            'Your order is complete. The items will now appear on the Orders page.',
          ),
        });
      }
    });
    return () => abortController.abort();
  };
  return (
      <>
        <ButtonSet className={isTablet ? styles.tablet : styles.desktop}>
                <Button className={styles.button} kind="secondary" onClick={handleCancelClicked}>
                  {t('cancel', 'Cancel')}
                </Button>
                <Button className={styles.button} kind="primary" onClick={handleOrderSubmitted}>
                  {t('signAndClose', 'Sign and close')}
                </Button>
        </ButtonSet>
        <Accordion>
        {
          items.map((item, index) => (
            <AccordionItem open={closeItem()} title={
              <>
              <span>
                <strong className={styles.dosageInfo}>
                  {capitalize(item.commonMedicationName)} ({item.dosage.dosage})
                </strong>{' '}
                <span className={styles.bodyShort01}>
                  &mdash; {item.route.name} &mdash; {item.dosageUnit.name} &mdash;{' '}
                </span>
                <span className={styles.caption01}>{t('dose', 'Dose').toUpperCase()}</span>{' '}
                <strong className={styles.dosageInfo}>{item.dosage.dosage}</strong>
              </span>
            </>
            }>
              
              <MedicationOrderForm
                durationUnits={durationUnits}
                initialOrderBasketItem={item}
                onSign={handleSaveClicked}
                formInAccordion={true}
                onCancel={handleCancelClicked}
              />
            </AccordionItem>
          ))
        }
        
        </Accordion>
      </>

    );
});

export default PrescribedMedicationsForm;
