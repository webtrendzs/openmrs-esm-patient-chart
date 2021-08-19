import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import VitalsBiometricInput from './vitals-biometrics-input.component';
import Button from 'carbon-components-react/es/components/Button';
import { Column, Grid, Row } from 'carbon-components-react/es/components/Grid';
import { useConfig, createErrorHandler, useSessionUser, showToast, showNotification } from '@openmrs/esm-framework';
import { calculateBMI, isInNormalRange } from './vitals-biometrics-form.utils';
import { savePatientVitals, useVitalsConceptMetadata } from '../vitals.resource';
import { ConfigObject } from '../../config-schema';
import styles from './vitals-biometrics-form.component.scss';

interface VitalsAndBiometricsFormProps {
  closeWorkspace(): void;
  isTablet: boolean;
  patientUuid: string;
}

export interface PatientVitalAndBiometric {
  systolicBloodPressure: string;
  diastolicBloodPressure: string;
  pulse: string;
  oxygenSaturation: string;
  respiratoryRate: string;
  generalPatientNote: string;
  weight?: string;
  height?: string;
  temperature?: string;
  midUpperArmCircumference?: string;
}

const VitalsAndBiometricsForm: React.FC<VitalsAndBiometricsFormProps> = ({ patientUuid, closeWorkspace, isTablet }) => {
  const { t } = useTranslation();
  const session = useSessionUser();
  const config = useConfig() as ConfigObject;
  const biometricsUnitsSymbols = config.biometrics;
  const [patientVitalAndBiometrics, setPatientVitalAndBiometrics] = useState<PatientVitalAndBiometric>();
  const [patientBMI, setPatientBMI] = useState<number>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: conceptData } = useVitalsConceptMetadata();
  const conceptUnits = conceptData ? conceptData.conceptUnits : null;
  const conceptMetadata = conceptData ? conceptData.metadata : null;

  const isBmiInNormalRange = (value: number | undefined | string) => {
    if (value === undefined || value === '') return true;
    return value >= 18.5 && value <= 24.9;
  };

  const savePatientVitalsAndBiometrics = () => {
    setIsSubmitting(true);
    const ac = new AbortController();
    savePatientVitals(
      config.vitals.encounterTypeUuid,
      config.vitals.formUuid,
      config.concepts,
      patientUuid,
      patientVitalAndBiometrics,
      new Date(),
      ac,
      session?.sessionLocation?.uuid,
    )
      .then((response) => {
        if (response.status === 201) {
          closeWorkspace();

          showToast({
            kind: 'success',
            description: t('vitalsAndBiometricsSaved', 'Vitals and biometrics saved successfully'),
          });
        }
      })
      .catch((err) => {
        createErrorHandler();

        showNotification({
          title: t('vitalsAndBiometricsSaveError', 'Error saving vitals and biometrics'),
          kind: 'error',
          critical: true,
          description: err?.message,
        });
      })
      .finally(() => {
        ac.abort();
      });
  };

  useEffect(() => {
    if (patientVitalAndBiometrics?.height && patientVitalAndBiometrics?.weight) {
      const calculatedBmi = calculateBMI(
        Number(patientVitalAndBiometrics.weight),
        Number(patientVitalAndBiometrics.height),
      );
      setPatientBMI(calculatedBmi);
    }
  }, [patientVitalAndBiometrics?.weight, patientVitalAndBiometrics?.height]);

  return (
    <Grid condensed>
      <Row>
        <Column>
          <p className={styles.vitalsTitle}>{t('vitals', 'Vitals')}</p>
        </Column>
      </Row>
      <Row>
        <Column>
          <VitalsBiometricInput
            title={t('bloodPressure', 'Blood Pressure')}
            onInputChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              event.target.name === 'systolic'
                ? setPatientVitalAndBiometrics({
                    ...patientVitalAndBiometrics,
                    systolicBloodPressure: event.target.value,
                  })
                : setPatientVitalAndBiometrics({
                    ...patientVitalAndBiometrics,
                    diastolicBloodPressure: event.target.value,
                  });
            }}
            textFields={[
              {
                name: t('systolic', 'systolic'),
                separator: '/',
                type: 'text',
                value: patientVitalAndBiometrics?.systolicBloodPressure || '',
              },
              {
                name: t('diastolic', 'diastolic'),
                type: 'text',
                value: patientVitalAndBiometrics?.diastolicBloodPressure || '',
              },
            ]}
            unitSymbol={conceptUnits ? conceptUnits[0] : ''}
            inputIsNormal={
              isInNormalRange(
                conceptMetadata,
                config.concepts.systolicBloodPressureUuid,
                patientVitalAndBiometrics?.systolicBloodPressure,
              ) &&
              isInNormalRange(
                conceptMetadata,
                config.concepts.diastolicBloodPressureUuid,
                patientVitalAndBiometrics?.diastolicBloodPressure,
              )
            }
            isTablet={isTablet}
          />
        </Column>
        <Column>
          <VitalsBiometricInput
            title={t('pulse', 'Pulse')}
            onInputChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPatientVitalAndBiometrics({
                ...patientVitalAndBiometrics,
                pulse: event.target.value,
              });
            }}
            textFields={[
              {
                name: t('pulse', 'Pulse'),
                type: 'text',
                value: patientVitalAndBiometrics?.pulse || '',
              },
            ]}
            unitSymbol={conceptUnits ? conceptUnits[5] : ''}
            inputIsNormal={isInNormalRange(
              conceptMetadata,
              config.concepts['pulseUuid'],
              patientVitalAndBiometrics?.pulse,
            )}
            isTablet={isTablet}
          />
        </Column>
        <Column>
          <VitalsBiometricInput
            title={t('spo2', 'SpO2')}
            onInputChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPatientVitalAndBiometrics({
                ...patientVitalAndBiometrics,
                oxygenSaturation: event.target.value,
              });
            }}
            textFields={[
              {
                name: t('oxygenSaturation', 'Oxygen Saturation'),
                type: 'text',
                value: patientVitalAndBiometrics?.oxygenSaturation || '',
              },
            ]}
            unitSymbol={conceptUnits ? conceptUnits[6] : ''}
            inputIsNormal={isInNormalRange(
              conceptMetadata,
              config.concepts['oxygenSaturationUuid'],
              patientVitalAndBiometrics?.oxygenSaturation,
            )}
            isTablet={isTablet}
          />
        </Column>
        <Column>
          <VitalsBiometricInput
            title={t('respirationRate', 'Respiration Rate')}
            onInputChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPatientVitalAndBiometrics({
                ...patientVitalAndBiometrics,
                respiratoryRate: event.target.value,
              });
            }}
            textFields={[
              {
                name: t('respirationRate', 'Respiration Rate'),
                type: 'text',
                value: patientVitalAndBiometrics?.respiratoryRate || '',
              },
            ]}
            unitSymbol={conceptUnits ? conceptUnits[8] : ''}
            inputIsNormal={isInNormalRange(
              conceptMetadata,
              config.concepts['respiratoryRateUuid'],
              patientVitalAndBiometrics?.respiratoryRate,
            )}
            isTablet={isTablet}
          />
        </Column>
      </Row>
      <Row>
        <Column>
          <VitalsBiometricInput
            title={t('temp', 'Temp')}
            onInputChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPatientVitalAndBiometrics({
                ...patientVitalAndBiometrics,
                temperature: event.target.value,
              });
            }}
            textFields={[
              {
                name: t('temperature', 'Temperature'),
                type: 'text',
                value: patientVitalAndBiometrics?.temperature || '',
              },
            ]}
            unitSymbol={conceptUnits ? conceptUnits[2] : ''}
            inputIsNormal={isInNormalRange(
              conceptMetadata,
              config.concepts['temperatureUuid'],
              patientVitalAndBiometrics?.temperature,
            )}
            isTablet={isTablet}
          />
        </Column>
      </Row>
      <Row>
        <Column>
          <VitalsBiometricInput
            title={t('notes', 'Notes')}
            onInputChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPatientVitalAndBiometrics({
                ...patientVitalAndBiometrics,
                generalPatientNote: event.target.value,
              });
            }}
            textFields={[
              {
                name: t('notes', 'Notes'),
                type: 'textArea',
                value: patientVitalAndBiometrics?.generalPatientNote,
              },
            ]}
            textFieldWidth="26.375rem"
            placeholder={t('additionalNoteText', 'Type any additional notes here')}
            inputIsNormal={true}
            isTablet={isTablet}
          />
        </Column>
      </Row>

      <Row>
        <Column>
          <p className={styles.vitalsTitle}>{t('biometrics', 'Biometrics')}</p>
        </Column>
      </Row>
      <Row>
        <Column>
          <VitalsBiometricInput
            title={t('weight', 'Weight')}
            onInputChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPatientVitalAndBiometrics({
                ...patientVitalAndBiometrics,
                weight: event.target.value,
              });
            }}
            textFields={[
              {
                name: t('weight', 'Weight'),
                type: 'text',
                value: patientVitalAndBiometrics?.weight || '',
              },
            ]}
            unitSymbol={conceptUnits ? conceptUnits[4] : ''}
            inputIsNormal={true}
            isTablet={isTablet}
          />
        </Column>
        <Column>
          <VitalsBiometricInput
            title={t('height', 'Height')}
            onInputChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPatientVitalAndBiometrics({
                ...patientVitalAndBiometrics,
                height: event.target.value,
              });
            }}
            textFields={[
              {
                name: t('height', 'Height'),
                type: 'text',
                value: patientVitalAndBiometrics?.height || '',
              },
            ]}
            unitSymbol={conceptUnits ? conceptUnits[3] : ''}
            inputIsNormal={true}
            isTablet={isTablet}
          />
        </Column>
        <Column>
          <VitalsBiometricInput
            title={t('bmiCalc', 'BMI (calc.)')}
            onInputChange={() => {}}
            textFields={[
              {
                name: t('bmi', 'BMI'),
                type: 'text',
                value: patientBMI || '',
              },
            ]}
            unitSymbol={biometricsUnitsSymbols['bmiUnit']}
            disabled={true}
            inputIsNormal={isBmiInNormalRange(patientBMI)}
            isTablet={isTablet}
          />
        </Column>
        <Column>
          <VitalsBiometricInput
            title={t('muac', 'MUAC')}
            onInputChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPatientVitalAndBiometrics({
                ...patientVitalAndBiometrics,
                midUpperArmCircumference: event.target.value,
              });
            }}
            textFields={[
              {
                name: t('muac', 'MUAC'),
                type: 'text',
                value: patientVitalAndBiometrics?.midUpperArmCircumference || '',
              },
            ]}
            unitSymbol={conceptUnits ? conceptUnits[7] : ''}
            inputIsNormal={isInNormalRange(
              conceptMetadata,
              config.concepts['midUpperArmCircumferenceUuid'],
              patientVitalAndBiometrics?.midUpperArmCircumference,
            )}
            isTablet={isTablet}
          />
        </Column>
      </Row>
      <Row>
        <Column>
          <Button onClick={closeWorkspace} className={styles.vitalsButton} kind="secondary">
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={savePatientVitalsAndBiometrics}
            className={styles.vitalsButton}
            kind="primary">
            {t('signAndSave', 'Sign & Save')}
          </Button>
        </Column>
      </Row>
    </Grid>
  );
};

export default VitalsAndBiometricsForm;
