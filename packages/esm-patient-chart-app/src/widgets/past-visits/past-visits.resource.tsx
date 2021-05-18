import dayjs from 'dayjs';
import { map } from 'rxjs/operators';
import { getVisitsForPatient, OpenmrsResource, Visit } from '@openmrs/esm-framework';

export interface MappedVisit {
  id: string;
  location: string;
  startDate: string;
  startTime: string;
  visitType: string;
  obs?: Array<OpenmrsResource>;
}

export function fetchPastVisits(patientID: string, abortController: AbortController) {
  const customRepresentation =
    'custom:(uuid,encounters:(uuid,encounterDatetime,' +
    'form:(uuid,name),location:ref,obs:(uuid,display,value,valueCodedName),' +
    'encounterType:ref,encounterProviders:(uuid,display,provider:(uuid,display))),' +
    'patient:(uuid,uuid),visitType:(uuid,name,display),' +
    'attributes:(uuid,display,value),' +
    'location:(uuid,name,display),startDatetime,stopDatetime)';

  return getVisitsForPatient(patientID, abortController, customRepresentation).pipe(
    map(({ data: { results } }) => results),
    map((visits: Array<Visit>) => visits.map(mapVisitProperties)),
  );
}

const mapVisitProperties = (visitData: Visit): MappedVisit => {
  return {
    id: visitData.uuid,
    location: visitData?.location?.display,
    startDate: dayjs(visitData?.startDatetime).format('DD - MM - YYYY'),
    startTime: dayjs(visitData?.startDatetime).format('HH:mm'),
    visitType: visitData?.visitType?.display,
    obs: visitData?.encounters?.map((encounter) => encounter?.obs),
  };
};
