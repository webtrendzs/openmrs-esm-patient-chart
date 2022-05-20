import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createErrorHandler, OpenmrsResource, showToast, useLayoutType, useSession } from '@openmrs/esm-framework';
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
import { daysDurationUnit } from '../constants';


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
  const [showSignClose, setShowSignClose] = useState(false);
  const [medicationsForOrder, setMedicationsForOrder] = useState<Array<OrderBasketItem>>([]);
  const [toggledItem, setToggledItem] = useState<Array<boolean>>([]);

  useMemo(() => {
    const accordionItems = Array.from({length: items.length}, i => i = false);
    // open the first accordion
    accordionItems[0] = true;
    setToggledItem(accordionItems);
    const abortController = new AbortController();
    const durationUnitsRequest = getDurationUnits(abortController, daysDurationUnit.uuid).then(
      (res) => {setDurationUnits(res.data.setMembers)},
      createErrorHandler,
    );
  
    Promise.all([durationUnitsRequest]).finally(() => setIsLoading(true));
    return () => abortController.abort();

  }, [items]);

  const sessionUser = useSession();
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

  const toggleAccordions = (accordions) => {
    const _items = [...accordions];
    let openIndex = 0;
    accordions.forEach((item, index) => {
      // close the current
      if(item==true) { 
        _items[index] = false; 
        openIndex =index + 1;
        // open the next
        if(openIndex < items.length) _items[openIndex] = true;
      }
    });
    const allClosed = _items.filter(i => i==false)
    if(allClosed.length == _items.length)  setShowSignClose(true);
    return _items;
  }
  
  const handleSaveClicked = (order) => {
    
    if(order.pillsDispensed == 0 || order.duration=='') {
      showToast({
        critical: true,
        kind: 'error',
        title: t('orderInvalid', 'Invalid Form'),
        description: t(
          'orderErrorText',
          'You must fill out the Quantity and Duration of this request before you proceed',
        ),
      });

    } else {
      setToggledItem(toggleAccordions(toggledItem));
      setMedicationsForOrder((existingOrders) => {
        return [...existingOrders, order];
      });
      showToast({
        critical: true,
        kind: 'success',
        millis: 7000,
        title: t('medicationAdded', 'Refill Requested Added, Fill the Next'),
        description: <>
        <span>
          <strong className={styles.dosageInfo}>
            {capitalize(order.commonMedicationName)} ({order.dosage.dosage})
          </strong>{' '}
          <span className={styles.bodyShort01}>
            &mdash; {order.route.name} &mdash; {order.dosageUnit.name} &mdash;{' '}
          </span>
          <span className={styles.caption01}>{t('dose', 'Dose').toUpperCase()}</span>{' '}
          <strong className={styles.dosageInfo}>{order.frequency.name}</strong>
        </span>
      </>,
      });
    }
    
  };


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
        <Accordion>
        {
          items.map((item, index) => (
            <AccordionItem open={toggledItem[index]} title={
              <>
              <span>
                <strong className={styles.dosageInfo}>
                  {capitalize(item.commonMedicationName)} ({item.dosage.dosage})
                </strong>{' '}
                <span className={styles.bodyShort01}>
                  &mdash; {item.route.name} &mdash; {item.dosageUnit.name} &mdash;{' '}
                </span>
                <span className={styles.caption01}>{t('dose', 'Dose').toUpperCase()}</span>{' '}
                <strong className={styles.dosageInfo}>{item.frequency.name}</strong>
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
        {showSignClose ? (<ButtonSet className={isTablet ? styles.tablet : styles.desktop}>
                <Button className={styles.button} kind="secondary" onClick={handleCancelClicked}>
                  {t('cancel', 'Cancel')}
                </Button>
                <Button className={styles.button} kind="primary" onClick={handleOrderSubmitted}>
                  {t('signAndClose', 'Sign and close')}
                </Button>
        </ButtonSet>) : (null) 
        }
      </>

    );
});

export default PrescribedMedicationsForm;
