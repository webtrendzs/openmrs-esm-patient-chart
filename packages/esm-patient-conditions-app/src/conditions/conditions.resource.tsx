import useSWR from 'swr';
import { map } from 'rxjs/operators';
import { fhirBaseUrl, openmrsFetch, openmrsObservableFetch } from '@openmrs/esm-framework';
import { CodedCondition, Condition, ConditionsFetchResponse, FhirCondition } from '../types';

export function useConditions(patientIdentifier: string) {
  const { data, error, isValidating } = useSWR<{ data: ConditionsFetchResponse }, Error>(
    `${fhirBaseUrl}/Condition?patient.identifier=${patientIdentifier}`,
    openmrsFetch,
  );

  const formattedConditions =
    data?.data.total > 0
      ? data?.data.entry
          .map((entry) => entry.resource ?? [])
          .map(mapConditionProperties)
          .sort((a, b) => (b?.onsetDateTime > a?.onsetDateTime ? 1 : -1))
      : null;

  return {
    data: data ? formattedConditions : null,
    isError: error,
    isLoading: !data && !error,
    isValidating: isValidating,
  };
}

export function searchConditionConcepts(searchTerm: string) {
  return openmrsObservableFetch<{ results: Array<CodedCondition> }>(
    `/ws/rest/v1/conceptsearch?conceptClasses=8d4918b0-c2cc-11de-8d13-0010c6dffd0f&q=${searchTerm}`,
  ).pipe(map(({ data }) => data.results));
}

export function getConditionByUuid(conditionUuid: string) {
  return openmrsObservableFetch<{ data: FhirCondition }>(`${fhirBaseUrl}/Condition/${conditionUuid}`).pipe(
    map(({ data }) => mapConditionProperties(data.data)),
  );
}

export function mapConditionProperties(condition: FhirCondition): Condition {
  return {
    clinicalStatus: condition?.clinicalStatus?.coding[0]?.code,
    conceptId: condition?.code?.coding[0]?.code,
    display: condition?.code?.coding[0]?.display,
    onsetDateTime: condition?.onsetDateTime,
    recordedDate: condition?.recordedDate,
    id: condition?.id,
  };
}

export function createPatientCondition(payload, abortController) {
  return openmrsObservableFetch(`${fhirBaseUrl}/Condition`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: payload,
    signal: abortController,
  });
}
