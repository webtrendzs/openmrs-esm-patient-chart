import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import { OrderPost, PatientMedicationFetchResponse } from '../types/order';
import { careSettingUuid } from '../constants';

const durationUnitsConcept = '52e8a934-d57c-4ef0-9fb7-7c15d816b723';

/**
 * Fast, lighweight, reusable data fetcher with built-in cache invalidation that
 * returns a patient's current orders.
 * @param patientUuid The UUID of the patient whose orders should be fetched.
 * @param status The status/the kind of orders to be fetched.
 */
export function usePatientOrders(patientUuid: string, status: 'ACTIVE' | 'any') {
  const customRepresentation =
    'custom:(uuid,dosingType,orderNumber,accessionNumber,' +
    'patient:ref,action,careSetting:ref,previousOrder:ref,dateActivated,scheduledDate,dateStopped,autoExpireDate,' +
    'orderType:ref,encounter:ref,orderer:(uuid,display,person:(display)),orderReason,orderReasonNonCoded,orderType,urgency,instructions,' +
    'commentToFulfiller,drug:(uuid,name,strength,dosageForm:(display,uuid),concept),dose,doseUnits:ref,' +
    'frequency:ref,asNeeded,asNeededCondition,quantity,quantityUnits:ref,numRefills,dosingInstructions,' +
    'duration,durationUnits:ref,route:ref,brandName,dispenseAsWritten)';

  const { data, error, isValidating } = useSWR<{ data: PatientMedicationFetchResponse }, Error>(
    `/ws/rest/v1/order?patient=${patientUuid}&careSetting=${careSettingUuid}&status=${status}&v=${customRepresentation}`,
    openmrsFetch,
  );

  const drugOrders = data?.data?.results
    ? data.data.results.filter((order) => order.orderType.display === 'Drug')
    : null;

  return {
    data: data ? drugOrders : null,
    isLoading: !data && !error,
    isError: error,
    isValidating,
  };
}

export function getPatientEncounterId(patientUuid: string, abortController: AbortController) {
  return openmrsFetch(`/ws/rest/v1/encounter?patient=${patientUuid}&order=desc&limit=1&v=custom:(uuid)`, {
    signal: abortController.signal,
  });
}

export function getDrugByName(drugName: string, abortController?: AbortController) {
  return openmrsFetch(
    `/ws/rest/v1/drug?q=${drugName}&v=custom:(uuid,name,strength,dosageForm:(display,uuid),concept)`,
    {
      signal: abortController?.signal,
    },
  );
}

export function getDurationUnits(abortController: AbortController) {
  return openmrsFetch(`/ws/rest/v1/concept/${durationUnitsConcept}?v=custom:(setMembers:(uuid,display))`, abortController);
}

export function getMedicationByUuid(abortController: AbortController, orderUuid: string) {
  return openmrsFetch(
    `/ws/rest/v1/order/${orderUuid}?v=custom:(uuid,route:(uuid,display),action,urgency,display,drug:(display,strength),frequency:(display),dose,doseUnits:(display),orderer,dateStopped,dateActivated,previousOrder,numRefills,duration,durationUnits:(display),dosingInstructions)`,
    {
      signal: abortController.signal,
    },
  );
}

export function postOrder(body: OrderPost, abortController?: AbortController) {
  return openmrsFetch(`/ws/rest/v1/order`, {
    method: 'POST',
    signal: abortController?.signal,
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}


export function getPatientHTNEncounters(patientUuid: string, encounterTypes: Array<string>, abortController: AbortController) {
  const customRepresentation =
    'custom:(uuid,display,encounterDatetime,patient,obs,' +
    'encounterProviders:(uuid,display,' +
    'encounterRole:(uuid,display),' +
    'provider:(uuid,person:(uuid,display)))';

  const encounters = [];
  encounterTypes.forEach((encounterType) => {
    encounters.push(openmrsFetch(`/ws/rest/v1/encounter?patient=${patientUuid}&order=desc&encounterType=${encounterType}&limit=1&v=${customRepresentation}`, {
      signal: abortController.signal,
    }));
  })
  return Promise.all(encounters);
}
