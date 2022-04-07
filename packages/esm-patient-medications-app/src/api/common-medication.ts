import { Obs } from '../prescriptions/prescribed-medications';
import { PrescribedMed } from '../types/prescribed-medication';
import commonMedications from './common-medication.json';

export interface CommonMedication {
  name: string;
  uuid: string;
  strength: string;
  dosageUnits: Array<CommonMedicationDosageUnit>;
  route: Array<CommonMedicationRoute>;
  commonFrequencies: Array<CommonMedicationFrequency>;
  commonDosages: Array<CommonMedicationDosage>;
}

export interface CommonMedicationDosageUnit {
  uuid: string;
  name: string;
  selected?: boolean;
}

export interface CommonMedicationRoute {
  name: string;
  conceptUuid: string;
  selected?: boolean;
}

export interface CommonMedicationFrequency {
  name: string;
  conceptUuid: string;
  selected?: boolean;
}

export interface CommonMedicationDosage {
  dosage: string;
  numberOfPills: number;
  selected?: boolean;
}

export function getCommonMedicationByUuid(uuid: string): CommonMedication | undefined {
  return commonMedications.filter((x) => x.uuid === uuid)[0];
}

export function getCommonMedicationByName(name: string): CommonMedication | undefined {
  return commonMedications.filter((x) => x.name.toLowerCase() === name.toLowerCase())[0];
}

export function mapCommonMedsWithEncounter(prescribedMeds: Array<string>): Array<CommonMedication> | [] {
  const commonMeds: Array<CommonMedication> = [];
  prescribedMeds.forEach((med) => {
    commonMeds.push(commonMedications.filter((x) => x.name.toLowerCase() === med.toLowerCase())[0]);
  });

  return commonMeds;
}
