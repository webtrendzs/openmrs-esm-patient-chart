import React, { useCallback } from 'react';
import Add16 from '@carbon/icons-react/es/add/16';
import User16 from '@carbon/icons-react/es/user/16';
import capitalize from 'lodash-es/capitalize';
import styles from './medications-details-table.scss';
import {
  DataTable,
  Button,
  InlineLoading,
  OverflowMenu,
  OverflowMenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TooltipIcon,
} from 'carbon-components-react';
import { getDosage } from '../utils/get-dosage';
import { useTranslation } from 'react-i18next';
import { compare } from '../utils/compare';
import { connect } from 'unistore/react';
import { OrderBasketStore, OrderBasketStoreActions, orderBasketStoreActions } from '../medications/order-basket-store';
import { Order } from '../types/order';
import { OrderBasketItem } from '../types/order-basket-item';
import { CardHeader, launchPatientWorkspace } from '@openmrs/esm-patient-common-lib';
import { formatDate } from '@openmrs/esm-framework';
import dayjs from 'dayjs';

export interface ActiveMedicationsProps {
  isValidating?: boolean;
  title?: string;
  medications?: Array<Order> | null;
  showAddNewButton: boolean;
  showDiscontinueButton: boolean;
  showModifyButton: boolean;
  showReorderButton: boolean;
  showOrderButton: boolean;
}

const MedicationsDetailsTable = connect<
  ActiveMedicationsProps,
  OrderBasketStore,
  OrderBasketStoreActions,
  ActiveMedicationsProps
>(
  'items',
  orderBasketStoreActions,
)(
  ({
    isValidating,
    title,
    medications,
    showDiscontinueButton,
    showModifyButton,
    showReorderButton,
    showOrderButton,
    showAddNewButton,
    items,
    setItems,
  }: ActiveMedicationsProps & OrderBasketStore & OrderBasketStoreActions) => {
    const { t } = useTranslation();
    const openOrderBasket = React.useCallback(() => launchPatientWorkspace('order-basket-workspace'), []);

    const tableHeaders = [
      {
        key: 'startDate',
        header: t('startDate', 'Start date'),
        isSortable: true,
        isVisible: true,
      },
      {
        key: 'details',
        header: t('details', 'Details'),
        isSortable: true,
        isVisible: true,
      },
    ];
    const tableRows = medications?.map((medication, id) => ({
      id: `${id}`,
      details: {
        sortKey: medication.drug?.name,
        content: (
          <div className={styles.medicationRecord}>
            <div>
              <p className={styles.bodyLong01}>
                <strong>{capitalize(medication.drug?.name)}</strong> &mdash; {medication.drug?.strength?.toLowerCase()}{' '}
                &mdash; {medication.doseUnits?.display.toLowerCase()}
              </p>
              <p className={styles.bodyLong01}>
                <span className={styles.label01}>{t('dose', 'Dose').toUpperCase()}</span>{' '}
                <span className={styles.dosage}>
                  {getDosage(medication.drug?.strength, medication.dose).toLowerCase()}
                </span>{' '}
                &mdash; {medication.route?.display.toLowerCase()} &mdash; {medication.frequency?.display.toLowerCase()}{' '}
                &mdash;{' '}
                {!medication.duration
                  ? t('medicationIndefiniteDuration', 'Indefinite duration').toLowerCase()
                  : t('medicationDurationAndUnit', 'for {duration} {durationUnit}', {
                      duration: medication.duration,
                      durationUnit: medication.durationUnits?.display.toLowerCase(),
                    })}{' '}
                {medication.numRefills !== 0 && (
                  <span>
                    <span className={styles.label01}> &mdash; {t('refills', 'Refills').toUpperCase()}</span>{' '}
                    {medication.numRefills}
                  </span>
                )}
                {medication.dosingInstructions && (
                  <span> &mdash; {medication.dosingInstructions.toLocaleLowerCase()}</span>
                )}
              </p>
            </div>
            <p className={styles.bodyLong01}>
              {medication.orderReasonNonCoded ? (
                <span>
                  <span className={styles.label01}>{t('indication', 'Indication').toUpperCase()}</span>{' '}
                  {medication.orderReasonNonCoded}
                </span>
              ) : null}
              {medication.quantity ? (
                <span>
                  <span className={styles.label01}> &mdash; {t('quantity', 'Quantity').toUpperCase()}</span>{' '}
                  {medication.quantity}
                </span>
              ) : null}
              {medication.dateStopped ? (
                <span className={styles.bodyShort01}>
                  <span className={styles.label01}>
                    {medication.quantity ? ` — ` : ''} {t('endDate', 'End date').toUpperCase()}
                  </span>{' '}
                  {formatDate(new Date(medication.dateStopped))}
                </span>
              ) : null}
            </p>
          </div>
        ),
      },
      startDate: {
        sortKey: dayjs(medication.dateActivated).toDate(),
        content: (
          <div className={styles.startDateColumn}>
            <span>{formatDate(new Date(medication.dateActivated))}</span>
            <InfoTooltip orderer={medication.orderer?.person?.display ?? '--'} />
          </div>
        ),
      },
    }));

    const sortRow = (cellA, cellB, { sortDirection, sortStates }) => {
      return sortDirection === sortStates.DESC
        ? compare(cellB.sortKey, cellA.sortKey)
        : compare(cellA.sortKey, cellB.sortKey);
    };

    return (
      <div className={styles.widgetCard}>
        <CardHeader title={title}>
          {isValidating ? (
            <span>
              <InlineLoading />
            </span>
          ) : null}
          {showAddNewButton && (
            <Button kind="ghost" renderIcon={Add16} iconDescription="Launch order basket" onClick={openOrderBasket}>
              {t('add', 'Add')}
            </Button>
          )}
        </CardHeader>
        <DataTable
          data-floating-menu-container
          size="short"
          headers={tableHeaders}
          rows={tableRows}
          isSortable={true}
          sortRow={sortRow}
          overflowMenuOnHover={false}
        >
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer>
              <Table {...getTableProps()} useZebraStyles>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader
                        {...getHeaderProps({
                          header,
                          isSortable: header.isSortable,
                        })}
                      >
                        {header.header}
                      </TableHeader>
                    ))}
                    <TableHeader />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, rowIndex) => (
                    <TableRow className={styles.row} {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
                      ))}
                      <TableCell className="bx--table-column-menu">
                        <OrderBasketItemActions
                          showDiscontinueButton={showDiscontinueButton}
                          showModifyButton={showModifyButton}
                          showReorderButton={showReorderButton}
                          showOrderButton={showOrderButton}
                          medication={medications[rowIndex]}
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
      </div>
    );
  },
);

function InfoTooltip({ orderer }) {
  return (
    <TooltipIcon className={styles.tooltip} align="start" direction="top" tooltipText={orderer} renderIcon={User16}>
      {orderer}
    </TooltipIcon>
  );
}

export function OrderBasketItemActions({
  showDiscontinueButton,
  showModifyButton,
  showReorderButton,
  showOrderButton,
  medication,
  items,
  setItems,
}: {
  showDiscontinueButton: boolean;
  showModifyButton: boolean;
  showReorderButton: boolean;
  showOrderButton: boolean;
  medication: Order;
  items: Array<OrderBasketItem>;
  setItems: (items: Array<OrderBasketItem>) => void;
}) {
  const { t } = useTranslation();
  const alreadyInBasket = items.some((x) => x.uuid === medication.uuid);

  const handleDiscontinueClick = useCallback(() => {
    setItems([
      ...items,
      {
        uuid: medication.uuid,
        previousOrder: null,
        action: 'DISCONTINUE',
        drug: medication.drug,
        dosage: {
          dosage: getDosage(medication.drug.strength, medication.dose),
          numberOfPills: medication.dose,
        },
        dosageUnit: {
          uuid: medication.doseUnits.uuid,
          name: medication.doseUnits.display,
        },
        frequency: {
          conceptUuid: medication.frequency.uuid,
          name: medication.frequency.display,
        },
        route: {
          conceptUuid: medication.route.uuid,
          name: medication.route.display,
        },
        encounterUuid: medication.encounter.uuid,
        commonMedicationName: medication.drug.name,
        isFreeTextDosage: medication.dosingType === 'org.openmrs.FreeTextDosingInstructions',
        freeTextDosage:
          medication.dosingType === 'org.openmrs.FreeTextDosingInstructions' ? medication.dosingInstructions : '',
        patientInstructions:
          medication.dosingType !== 'org.openmrs.FreeTextDosingInstructions' ? medication.dosingInstructions : '',
        asNeeded: medication.asNeeded,
        asNeededCondition: medication.asNeededCondition,
        startDate: medication.dateActivated,
        duration: medication.duration,
        durationUnit: {
          uuid: medication.durationUnits.uuid,
          display: medication.durationUnits.display,
        },
        pillsDispensed: medication.quantity,
        numRefills: medication.numRefills,
        indication: medication.orderReasonNonCoded,
      },
    ]);
    launchPatientWorkspace('order-basket-workspace');
  }, [items, setItems, medication]);

  const handleModifyClick = useCallback(() => {
    setItems([
      ...items,
      {
        uuid: medication.uuid,
        previousOrder: medication.uuid,
        startDate: new Date(),
        action: 'REVISE',
        drug: medication.drug,
        dosage: {
          dosage: getDosage(medication.drug.strength, medication.dose),
          numberOfPills: medication.dose,
        },
        dosageUnit: {
          uuid: medication.doseUnits.uuid,
          name: medication.doseUnits.display,
        },
        frequency: {
          conceptUuid: medication.frequency.uuid,
          name: medication.frequency.display,
        },
        route: {
          conceptUuid: medication.route.uuid,
          name: medication.route.display,
        },
        encounterUuid: medication.encounter.uuid,
        commonMedicationName: medication.drug.name,
        isFreeTextDosage: medication.dosingType === 'org.openmrs.FreeTextDosingInstructions',
        freeTextDosage:
          medication.dosingType === 'org.openmrs.FreeTextDosingInstructions' ? medication.dosingInstructions : '',
        patientInstructions:
          medication.dosingType !== 'org.openmrs.FreeTextDosingInstructions' ? medication.dosingInstructions : '',
        asNeeded: medication.asNeeded,
        asNeededCondition: medication.asNeededCondition,
        duration: medication.duration,
        durationUnit: {
          uuid: medication.durationUnits.uuid,
          display: medication.durationUnits.display,
        },
        pillsDispensed: medication.quantity,
        numRefills: medication.numRefills,
        indication: medication.orderReasonNonCoded,
      },
    ]);
    launchPatientWorkspace('order-basket-workspace');
  }, [items, setItems, medication]);

  const handleReorderClick = useCallback(() => {
    setItems([
      ...items,
      {
        uuid: medication.uuid,
        previousOrder: null,
        startDate: new Date(),
        action: 'RENEWED',
        drug: medication.drug,
        dosage: {
          dosage: getDosage(medication.drug.strength, medication.dose),
          numberOfPills: medication.dose,
        },
        dosageUnit: {
          uuid: medication.doseUnits.uuid,
          name: medication.doseUnits.display,
        },
        frequency: {
          conceptUuid: medication.frequency.uuid,
          name: medication.frequency.display,
        },
        route: {
          conceptUuid: medication.route.uuid,
          name: medication.route.display,
        },
        encounterUuid: medication.encounter.uuid,
        commonMedicationName: medication.drug.name,
        isFreeTextDosage: medication.dosingType === 'org.openmrs.FreeTextDosingInstructions',
        freeTextDosage:
          medication.dosingType === 'org.openmrs.FreeTextDosingInstructions' ? medication.dosingInstructions : '',
        patientInstructions:
          medication.dosingType !== 'org.openmrs.FreeTextDosingInstructions' ? medication.dosingInstructions : '',
        asNeeded: medication.asNeeded,
        asNeededCondition: medication.asNeededCondition,
        duration: medication.duration,
        durationUnit: {
          uuid: medication.durationUnits.uuid,
          display: medication.durationUnits.display,
        },
        pillsDispensed: medication.quantity,
        numRefills: medication.numRefills,
        indication: medication.orderReasonNonCoded,
      },
    ]);
    launchPatientWorkspace('order-basket-workspace');
  }, [items, setItems, medication]);

  const handleOrderClick = useCallback(() => {
    const _medication: any = medication;
    console.log(_medication)
    setItems([
      ...items,
      {
        uuid: _medication.uuid,
        startDate: new Date(),
        action: 'NEW',
        drug: _medication.drug,
        dosage: {
          dosage: _medication.dosage.dosage,
          numberOfPills: _medication.dosage.numberOfPills,
        },
        dosageUnit: {
          uuid: _medication.dosageUnit.uuid,
          name: _medication.dosageUnit.name,
        },
        frequency: {
          conceptUuid: _medication.frequency.conceptUuid,
          name: _medication.frequency.name,
        },
        route: {
          conceptUuid: _medication.route.conceptUuid,
          name: _medication.route.name,
        },
        encounterUuid: _medication.encounterUuid,
        commonMedicationName: _medication.commonMedicationName,
        isFreeTextDosage: _medication.isFreeTextDosage,
        freeTextDosage:_medication.freeTextDosage,
        patientInstructions:_medication.patientInstructions,
        asNeeded: _medication.asNeeded,
        asNeededCondition: _medication.asNeededCondition,
        duration: _medication.duration,
        durationUnit: {
          uuid: _medication.durationUnit.uuid,
          display: _medication.durationUnit.display,
        },
        pillsDispensed: 0,
        numRefills: 0,
        indication: '',
      },
    ]);
    launchPatientWorkspace('order-basket-workspace');
  }, [items, setItems, medication]);

  return (
    <OverflowMenu selectorPrimaryFocus={'#modify'} flipped>
      {showOrderButton && (
        <OverflowMenuItem
          className={styles.menuItem}
          id="order"
          itemText={t('order', 'Order')}
          onClick={handleOrderClick}
          disabled={alreadyInBasket}
        />
      )}
      {showModifyButton && (
        <OverflowMenuItem
          className={styles.menuItem}
          id="modify"
          itemText={t('modify', 'Modify')}
          onClick={handleModifyClick}
          disabled={alreadyInBasket}
        />
      )}
      {showReorderButton && (
        <OverflowMenuItem
          className={styles.menuItem}
          id="reorder"
          itemText={t('reorder', 'Reorder')}
          onClick={handleReorderClick}
          disabled={alreadyInBasket}
        />
      )}
      {showDiscontinueButton && (
        <OverflowMenuItem
          className={styles.menuItem}
          id="discontinue"
          itemText={t('discontinue', 'Discontinue')}
          onClick={handleDiscontinueClick}
          disabled={alreadyInBasket}
          isDelete={true}
          hasDivider
        />
      )}
    </OverflowMenu>
  );
}

export default MedicationsDetailsTable;
