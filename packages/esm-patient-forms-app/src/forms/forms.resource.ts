import { openmrsFetch } from '@openmrs/esm-framework';
import { Encounter, Form } from '../types';
import uniqBy from 'lodash-es/uniqBy';
import useSWR from 'swr';

interface FormsFetchResponse {
  results: Array<Form>;
}

export function useForms() {
  const { data, error } = useSWR<{ data: FormsFetchResponse }, Error>(
    `/ws/rest/v1/form?v=custom:(uuid,name,encounterType:(uuid,name),version,published,retired,resources:(uuid,name,dataType,valueReference))`,
    openmrsFetch,
  );

  const forms = data?.data?.results ? data.data.results.map(mapToFormObject) : null;

  return {
    data: data ? forms : null,
    isError: error,
    isLoading: !data && !error,
  };
}

export function useEncounters(patientUuid: string, startDate: Date, endDate: Date) {
  const customRepresentation = `custom:(uuid,encounterDatetime,encounterType:(uuid,name),form:(uuid,name,encounterType:(uuid,name),version,published,retired,resources:(uuid,name,dataType,valueReference))`;
  const { data, error } = useSWR<{ data: FormsFetchResponse }, Error>(
    `/ws/rest/v1/encounter?v=${customRepresentation}&patient=${patientUuid}&fromdate=${startDate.toISOString()}&todate=${endDate.toISOString()}`,
    openmrsFetch,
  );

  const encounters = data?.data?.results ? data.data.results.map(mapToEncounterObject) : null;

  return {
    data: data
      ? uniqBy(
          encounters
            .filter((encounter) => encounter.form !== null)
            .sort(
              (encounterA, encounterB) =>
                encounterB.encounterDateTime.getTime() - encounterA.encounterDateTime.getTime(),
            ),
          'form.uuid',
        )
      : null,
    isError: error,
    isLoading: !data && !error,
  };
}

export function mapToFormObject(openmrsRestForm): Form {
  return {
    uuid: openmrsRestForm.uuid,
    name: openmrsRestForm.name || openmrsRestForm.display,
    published: openmrsRestForm.published,
    retired: openmrsRestForm.retired,
    encounterTypeUuid: openmrsRestForm.encounterType ? openmrsRestForm.encounterType.uuid : null,
    encounterTypeName: openmrsRestForm.encounterType ? openmrsRestForm.encounterType.name : null,
    lastCompleted: null,
  };
}

export function mapToEncounterObject(openmrsRestEncounter: any): Encounter {
  return {
    uuid: openmrsRestEncounter.uuid,
    encounterDateTime: new Date(openmrsRestEncounter.encounterDatetime),
    encounterTypeUuid: openmrsRestEncounter.encounterType ? openmrsRestEncounter.encounterType.uuid : null,
    encounterTypeName: openmrsRestEncounter.encounterType ? openmrsRestEncounter.encounterType.name : null,
    form: openmrsRestEncounter.form ? mapToFormObject(openmrsRestEncounter.form) : null,
  };
}
