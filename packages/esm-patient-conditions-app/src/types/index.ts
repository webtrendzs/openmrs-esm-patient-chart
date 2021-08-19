export interface ConditionsFetchResponse {
  entry: Array<{
    resource: FhirCondition;
  }>;
  id: string;
  meta?: {
    lastUpdated: string;
  };
  resourceType: string;
  total: number;
  type: string;
}

export interface FhirCondition {
  clinicalStatus: {
    coding: Array<CodingData>;
    display: String;
  };
  code: {
    coding: Array<CodingData>;
  };
  id: string;
  onsetDateTime: string;
  recordedDate: string;
  recorder: {
    display: string;
    reference: string;
    type: string;
  };
  resourceType: string;
  subject: {
    display: string;
    reference: string;
    type: string;
  };
  text: {
    div: string;
    status: string;
  };
}

export interface CodingData {
  code: string;
  display: string;
  extension?: Array<ExtensionData>;
  system?: string;
}

export interface ExtensionData {
  extension: [];
  url: string;
}

export interface DataCaptureComponentProps {
  entryStarted: () => void;
  entrySubmitted: () => void;
  entryCancelled: () => void;
  closeComponent: () => void;
}

export interface Condition {
  clinicalStatus: string;
  conceptId: string;
  display: string;
  onsetDateTime: string;
  recordedDate: string;
  id: string;
}

export interface CodedCondition {
  concept: {
    uuid: string;
    display: string;
  };
  conceptName: {
    uuid: string;
    display: string;
  };
  display: string;
}
