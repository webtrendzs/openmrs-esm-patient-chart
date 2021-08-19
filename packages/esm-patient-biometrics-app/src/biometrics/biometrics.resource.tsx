import { fhirBaseUrl, useConfig, openmrsFetch } from '@openmrs/esm-framework';
import useSWR from 'swr';
import { calculateBMI } from './biometric.helper';

export function useBiometrics(patientUuid: string) {
  const pageSize = 100;
  const config = useConfig();
  const { heightUuid, weightUuid } = config.concepts;

  const { data, error } = useSWR<{ data: DimensionFetchResponse }, Error>(
    `${fhirBaseUrl}/Observation?subject:Patient=${patientUuid}&code=${weightUuid},${heightUuid}&_count=${pageSize}`,
    openmrsFetch,
  );

  const observations = data?.data?.total > 0 ? data?.data?.entry.map((entry) => entry.resource ?? []) : null;

  let heightData;
  let weightData;

  if (observations) {
    heightData = observations.filter((obs: FhirDimensions) => obs.code.coding.some((sys) => sys.code === heightUuid));
    weightData = observations.filter((obs: FhirDimensions) => obs.code.coding.some((sys) => sys.code === weightUuid));
  }

  return {
    data: data ? formatDimensions(weightData, heightData) : null,
    isError: error,
    isLoading: !data && !error,
  };
}

function formatDimensions(weights: Array<FhirDimensions>, heights: Array<FhirDimensions>) {
  const weightDates = getDatesIssued(weights);
  const heightDates = getDatesIssued(heights);
  const uniqueDates = Array.from(new Set(weightDates?.concat(heightDates))).sort(latestFirst);

  return uniqueDates.map((date) => {
    const weight = weights.find((weight) => weight.issued === date);
    const height = heights.find((height) => height.issued === date);
    return {
      id: weight?.id ? weight.id : height?.id,
      weight: weight ? weight.valueQuantity.value : null,
      height: height ? height.valueQuantity.value : null,
      date: date,
      bmi: weight && height ? calculateBMI(weight.valueQuantity.value, height.valueQuantity.value) : null,
      obsData: {
        weight: weight,
        height: height,
      },
    };
  });
}

function latestFirst(a, b) {
  return new Date(b).getTime() - new Date(a).getTime();
}

function getDatesIssued(dimensionArray): string[] {
  return dimensionArray?.map((dimension) => dimension.issued);
}

export const useBiometricsConceptMetadata = () => {
  const customRepresentation = `?q=VITALS SIGNS&v=custom:(setMembers:(uuid,display,hiNormal,hiAbsolute,hiCritical,lowNormal,lowAbsolute,lowCritical,units))`;
  const { data, error } = useSWR<{ data: BiometricsConceptMetadataResponse }, Error>(
    `/ws/rest/v1/concept/${customRepresentation}`,
    openmrsFetch,
  );

  const conceptsUnits = data?.data?.results[0]?.setMembers.map((conceptUnit) => conceptUnit.units);

  return {
    data: data ? conceptsUnits : null,
    isError: error,
    isLoading: !data && !error,
  };
};

interface ConceptMetadata {
  uuid: string;
  display: string;
  hiNormal: number | string | null;
  hiAbsolute: number | string | null;
  hiCritical: number | string | null;
  lowNormal: number | string | null;
  lowAbsolute: number | string | null;
  lowCritical: number | string | null;
  units: string | null;
}

interface BiometricsConceptMetadataResponse {
  results: Array<{
    setMembers: Array<ConceptMetadata>;
  }>;
}

interface FhirDimensions {
  id: string;
  category: Array<{
    coding: Array<{
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      code: string;
      display: string;
    }>;
  };
  effectiveDatetime: string;
  issued: string;
  valueQuantity: {
    value: number;
    unit: string;
  };
}

interface DimensionFetchResponse {
  entry: Array<{
    resource: FhirDimensions;
  }>;
  id: string;
  resourceType: string;
  total: number;
  type: string;
}
