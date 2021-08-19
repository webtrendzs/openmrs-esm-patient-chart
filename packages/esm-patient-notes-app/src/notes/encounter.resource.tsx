import { fhirBaseUrl, openmrsFetch, openmrsObservableFetch } from '@openmrs/esm-framework';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import useSWR from 'swr';
import { Encounter, RestConditionsResponse, RestEncounter } from '../types';

export function useEncounters(patientUuid: string) {
  const { data, error } = useSWR<{ data: RestConditionsResponse }, Error>(
    `/ws/rest/v1/encounter?patient=${patientUuid}&v=custom:(uuid,display,encounterDatetime,location:(uuid,display,name),encounterType:(name,uuid),auditInfo:(creator:(display),changedBy:(display)),encounterProviders:(provider:(person:(display))))`,
    openmrsFetch,
  );

  const formattedNotes = data?.data.results.length
    ? data?.data.results.map(mapNoteProperties).sort((a, b) => (a.encounterDate < b.encounterDate ? 1 : -1))
    : null;

  return {
    data: data ? formattedNotes : null,
    isError: error,
    isLoading: !data && !error,
  };
}

export function getEncounters(patientIdentifer: string, abortController: AbortController) {
  return openmrsFetch(`${fhirBaseUrl}/Encounter?identifier=${patientIdentifer}`, {
    signal: abortController.signal,
  });
}

export function getEncounterById(encounterId: string) {
  return openmrsFetch(`${fhirBaseUrl}/Encounter?${encounterId}`);
}

export function getEncounterByUuid(encounterUuid: string) {
  return openmrsFetch(`${fhirBaseUrl}/Encounter?_id=${encounterUuid}`);
}

export function searchEncounterByPatientIdentifierWithMatchingVisit(patientIdentifer: string, visitUuid: string) {
  return openmrsFetch(`${fhirBaseUrl}/Encounter?identifier=${patientIdentifer},part-of=${visitUuid}`);
}

export function fetchEncounterByUuid(encounterUuid): Observable<any> {
  return openmrsObservableFetch(`/ws/rest/v1/encounter/${encounterUuid}`).pipe(map(({ data }) => data));
}

function mapNoteProperties(note: RestEncounter): Encounter {
  return {
    id: note.uuid,
    encounterDate: note.encounterDatetime,
    encounterType: note.encounterType?.name,
    encounterLocation: note.location?.display,
    encounterAuthor: note.encounterProviders?.[0]?.provider?.person?.display,
  };
}
