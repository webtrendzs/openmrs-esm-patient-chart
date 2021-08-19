import React from 'react';
import dayjs from 'dayjs';
import first from 'lodash-es/first';
import ContentSwitcher from 'carbon-components-react/es/components/ContentSwitcher';
import Switch from 'carbon-components-react/es/components/Switch';
import FormView from './form-view.component';
import styles from './forms.component.scss';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import { useEncounters, useForms } from './forms.resource';
import { filterAvailableAndCompletedForms } from './forms-utils';
import { Encounter } from '../types';
import EmptyFormView from './empty-form.component';
import { DataTableSkeleton } from 'carbon-components-react';

enum FormViewState {
  recommended = 0,
  completed,
  all,
}

interface FormsProps {
  patientUuid: string;
  patient: fhir.Patient;
}

const Forms: React.FC<FormsProps> = ({ patientUuid, patient }) => {
  const { t } = useTranslation();
  const displayText = t('forms', 'Forms');
  const headerTitle = t('forms', 'Forms');
  const fromDate = dayjs(new Date()).startOf('day').subtract(500, 'day');
  const toDate = dayjs(new Date()).endOf('day');
  const [selectedFormView, setSelectedFormView] = React.useState<FormViewState>(FormViewState.all);

  const { data: forms, isLoading: isLoadingForms, isError: isErrorForms } = useForms();
  const {
    data: encounters,
    isLoading: isLoadingEncounters,
    isError: isErrorEncounters,
  } = useEncounters(patientUuid, fromDate.toDate(), toDate.toDate());

  const completedForms =
    encounters && forms
      ? filterAvailableAndCompletedForms(forms, encounters).completed.map((encounters) => {
          encounters.form.complete = true;
          encounters.form.lastCompleted = encounters.encounterDateTime ? encounters.encounterDateTime : null;
          return encounters.form;
        })
      : null;

  const filledForms = forms
    ? forms.map((form) => {
        completedForms.map((completeForm) => {
          if (completeForm.uuid === form.uuid) {
            form.complete = true;
            form.lastCompleted = completeForm.lastCompleted ? completeForm.lastCompleted : null;
          }
        });
        return form;
      })
    : null;

  if (isLoadingEncounters || isLoadingForms) return <DataTableSkeleton />;
  if (isErrorForms) return <ErrorState error={isErrorForms} headerTitle={headerTitle} />;
  if (isErrorEncounters) return <ErrorState error={isErrorEncounters} headerTitle={headerTitle} />;
  if (filledForms) {
    return (
      <div className={styles.formsWidgetContainer}>
        <div className={styles.formsHeaderContainer}>
          <h4 className={`${styles.productiveHeading03} ${styles.text02}`}>{headerTitle}</h4>
          <div className={styles.contextSwitcherContainer}>
            <ContentSwitcher
              className={styles.contextSwitcherWidth}
              onChange={(event) => setSelectedFormView(event.name as any)}
              selectedIndex={selectedFormView}>
              <Switch name={FormViewState.recommended} text="Recommended" />
              <Switch name={FormViewState.completed} text="Completed" />
              <Switch name={FormViewState.all} text="All" />
            </ContentSwitcher>
          </div>
        </div>
        <div style={{ width: '100%' }}>
          {selectedFormView === FormViewState.completed && (
            <FormView
              forms={completedForms}
              patientUuid={patientUuid}
              patient={patient}
              encounterUuid={first<Encounter>(encounters)?.uuid}
            />
          )}
          {selectedFormView === FormViewState.all && (
            <FormView
              forms={filledForms}
              patientUuid={patientUuid}
              patient={patient}
              encounterUuid={first<Encounter>(encounters)?.uuid}
            />
          )}
          {selectedFormView === FormViewState.recommended && (
            <EmptyFormView action={t('noRecommendedFormsAvailable', 'No recommended forms available at the moment')} />
          )}
        </div>
      </div>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={t('helpText', 'Contact system Admin to configure form')} />;
};

export default Forms;
