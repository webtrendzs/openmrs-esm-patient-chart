import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  OverflowMenu,
  OverflowMenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow
} from 'carbon-components-react';
import Add16 from '@carbon/icons-react/es/add/16';
import { EmptyState, CardHeader, launchPatientWorkspace } from '@openmrs/esm-patient-common-lib';
import { createErrorHandler, formatDate } from '@openmrs/esm-framework';
import { connect } from 'unistore/react';
import { Provider } from 'unistore/react';

import { mapCommonMedsWithEncounter } from '../api/common-medication';
import { extractEncounterMedData, Obs } from '../prescriptions/prescribed-medications';

import { OrderBasketStore, orderBasketStore, orderBasketStoreActions, OrderBasketStoreActions } from '../medications/order-basket-store';
import styles from '../prescriptions/prescribed-medications.scss';
import { getPatientHTNEncounter } from '../api/api';
import { OrderBasketItem } from '../types/order-basket-item';

import { searchMedications } from '../order-basket/drug-search';

interface PrescribedMedicationsTableProps {
  patientUuid: string;
}

const PrescribedMedicationsTable = connect<
  PrescribedMedicationsTableProps,
  OrderBasketStore,
  OrderBasketStoreActions,
  PrescribedMedicationsTableProps
>(
  'items',
  orderBasketStoreActions,
)(
  ({
    patientUuid,
    items,
    setItems,
  }: PrescribedMedicationsTableProps & OrderBasketStore & OrderBasketStoreActions) => {
    const { t } = useTranslation();
    const displayText = t('prescribedMedications', 'Prescribed Medications');

    const [orderItems, setOrderItems] = useState<Array<OrderBasketItem> | []>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [encounter, setEncounter] = useState(null);

    useEffect(() => {
      const abortController = new AbortController();

      if (encounter) {
        const encounterData = extractEncounterMedData(encounter.obs);
        const commonMeds = mapCommonMedsWithEncounter(encounterData['CURRENT HYPERTENSION DRUGS USED FOR TREATMENT']);
        mimicSearchMedications(commonMeds, encounter.uuid, abortController).then((data) => {
          console.log("data", data);
          const medObs = encounterData['HYPERTENSION TREATMENT STARTED, DETAILED'];

          const orders = data.map((order: Array<any>) => {
            return order.filter((o) => getPrescriptionInfo(o, medObs))[0];
          });
          setOrderItems(orders);

          setIsLoading(false);
        });
        return () => abortController.abort();
      } else {

        const patientEncounterRequest = getPatientHTNEncounter(patientUuid, abortController).then(
          ({ data }) => {
            setEncounter(data.results[0]);
          },
          createErrorHandler,
        );

        Promise.all([patientEncounterRequest]).finally(() => setIsLoading(true));
        return () => abortController.abort();
      }

    }, [patientUuid, encounter]);

    const addToOrderBasket = React.useCallback(() => {
      setItems(orderItems.map((item) => {item.indication = 'HTN'; return item; }));
      launchPatientWorkspace('prescription-order-basket-workspace');
    }, [orderItems]);

    const tableHeaders = [
      {
        key: 'precsriptionDate',
        header: t('precsriptionDate', 'Precsription Date'),
        isVisible: true,
      },
      {
        key: 'details',
        header: t('details', 'Details'),
        isVisible: true,
      },
    ];

    const tableRows = orderItems?.map((medication, id) => ({
      id: `${id}`,
      precsriptionDate: {
        content: (
          <div className={styles.startDateColumn}>
            <span>{formatDate(new Date(medication.startDate))}</span>
          </div>
        ),
      },
      details: {
        content:
          <div className={styles.searchResultTile}>
            <div className={styles.searchResultTileContent}>
              <p>
                <strong>{medication.drug.concept.display.toLowerCase()}</strong> &mdash; {medication.dosage?.dosage.toLowerCase()} &mdash;{' '}
                {medication.dosageUnit.name}
                <br />
                <span className={styles.label01}>{medication.frequency.name}</span> &mdash;{' '}
                <span className={styles.label01}>{medication.route.name}</span>
              </p>
            </div>
          </div>
      }

    }));

    if (isLoading) return <DataTableSkeleton role="progressbar" />;

    if (orderItems.length > 0) {

      return (
        <Provider store={orderBasketStore}>
          <div className={''}>
            <CardHeader title={displayText}>
              <Button kind="ghost" renderIcon={Add16} iconDescription="add all to order basket" onClick={addToOrderBasket}>
                {t('orderAll', 'Add All')}
              </Button>
            </CardHeader>
            <DataTable
              data-floating-menu-container
              size="short"
              headers={tableHeaders}
              rows={tableRows}
              overflowMenuOnHover={false}
            >
              {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                <TableContainer>
                  <Table {...getTableProps()} useZebraStyles>
                    <TableHead>
                      <TableRow>
                        {headers.map((header) => (
                          <TableHeader {...getHeaderProps({ header })}>
                            {header.header}
                          </TableHeader>
                        ))}
                        <TableHeader />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, rowIndex) => (
                        <TableRow className={''} {...getRowProps({ row })}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
                          ))}
                          <TableCell className="bx--table-column-menu">
                            <PrescriptionOrderActions
                              medication={orderItems[rowIndex]}
                              items={items}
                              setItems={setItems}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          </div></Provider>);
    }

    return <EmptyState displayText={displayText} headerTitle={displayText} />;
  });


function mimicSearchMedications(prescriptions: Array<any>, encounterUuid: string, ab: AbortController): Promise<any> {
  const orders = [];
  prescriptions.forEach((med) => {
    orders.push(searchMedications(med.name, encounterUuid, ab));
  });

  return Promise.all(orders);
}

function getPrescriptionInfo(order: OrderBasketItem, prescribedMedsObs: Array<Obs>): boolean {

  const mapppedObs: Array<string> = prescribedMedsObs.map((ob) => {
    const drugName: any = ob.display.match(/\((.*)\)/)[1];
    const drugDosage = ob.display.match(/([+-]?([0-9]*[.])?[0-9]+)(mg)/i);
    const frequency = ob.groupMembers.filter(member => member.concept.display === 'MEDICATION FREQUENCY')[0];

    return (drugName + '/' + drugDosage[0] + '/' + frequency.value.display).toLowerCase();

  });

  return mapppedObs.includes((order.commonMedicationName + '/' + order.dosage.dosage + '/' + order.frequency.name).toLowerCase());
}

export function PrescriptionOrderActions({
  medication,
  items,
  setItems,
}: {
  medication: OrderBasketItem;
  items: Array<OrderBasketItem>;
  setItems: (items: Array<OrderBasketItem>) => void;
}) {
  const { t } = useTranslation();
  const alreadyInBasket = items.some((x) => x.uuid === medication.uuid);

  const handleOrderClick = useCallback(() => {
    setItems([
      {
        startDate: new Date(),
        action: 'NEW',
        drug: medication.drug,
        dosage: {
          dosage: medication.dosage.dosage,
          numberOfPills: medication.dosage.numberOfPills,
        },
        dosageUnit: {
          uuid: medication.dosageUnit.uuid,
          name: medication.dosageUnit.name,
        },
        frequency: {
          conceptUuid: medication.frequency.conceptUuid,
          name: medication.frequency.name,
        },
        route: {
          conceptUuid: medication.route.conceptUuid,
          name: medication.route.name,
        },
        encounterUuid: medication.encounterUuid,
        commonMedicationName: medication.commonMedicationName,
        isFreeTextDosage: medication.isFreeTextDosage,
        freeTextDosage: medication.freeTextDosage,
        patientInstructions: medication.patientInstructions,
        asNeeded: medication.asNeeded,
        asNeededCondition: medication.asNeededCondition,
        duration: medication.duration,
        durationUnit: {
          uuid: medication.durationUnit.uuid,
          display: medication.durationUnit.display,
        },
        pillsDispensed: 0,
        numRefills: 0,
        indication: 'HTN',
      },
    ]);
    launchPatientWorkspace('prescription-order-basket-workspace');
  }, [items, setItems, medication]);

  return (
    <OverflowMenu selectorPrimaryFocus={'#modify'} flipped>
      <OverflowMenuItem
        className={styles.menuItem}
        id="order"
        itemText={t('order', 'Order')}
        onClick={handleOrderClick}
        disabled={alreadyInBasket}
      />
    </OverflowMenu>
  );
}

export default PrescribedMedicationsTable;
