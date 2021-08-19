import React from 'react';
import { cache } from 'swr';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { attach, openmrsFetch } from '@openmrs/esm-framework';
import { mockFhirAllergyIntoleranceResponse } from '../../../../__mocks__/allergies.mock';
import { mockPatient } from '../../../../__mocks__/patient.mock';
import { render, waitForLoadingToFinish } from '../../../../tools/app-test-utils';
import AllergiesDetailedSummary from './allergies-detailed-summary.component';

const testProps = {
  patient: mockPatient,
  showAddAllergy: false,
};

const mockAttach = attach as jest.Mock;
const mockOpenmrsFetch = openmrsFetch as jest.Mock;
mockOpenmrsFetch.mockImplementation(jest.fn());

function renderAllergiesSummary() {
  render(<AllergiesDetailedSummary {...testProps} />);
}

describe('AllergiesDetailedSummary: ', () => {
  it("renders a detailed summary of the patient's allergic reactions and their manifestations", async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: mockFhirAllergyIntoleranceResponse });
    renderAllergiesSummary();

    await waitForLoadingToFinish();
    expect(screen.getByRole('heading', { name: /allergies/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();

    const expectedColumnHeaders = [/allergen/i, /severity and reaction/i, /since/i, /last updated/i];
    const expectedAllergies = [
      /ACE inhibitors unable-to-assess Anaphylaxis May-2021/i,
      /Fish low Anaphylaxis, Angioedema, Fever, Hives Some Comments Apr-2021/i,
      /Penicillins high Diarrhea, Cough, Musculoskeletal pain, Mental status change, Angioedema Patient allergies have been noted down/i,
      /Morphine high Mental status change Comments Nov-2020/i,
      /Aspirin high Mental status change Comments Nov-2020/i,
    ];
    expectedColumnHeaders.forEach((header) =>
      expect(screen.getByRole('columnheader', { name: new RegExp(header) })).toBeInTheDocument(),
    );
    expectedAllergies.forEach((allergy) =>
      expect(screen.getByRole('row', { name: new RegExp(allergy) })).toBeInTheDocument(),
    );

    testProps.showAddAllergy = true;
    renderAllergiesSummary();
    expect(await screen.queryByRole('button', { name: /add/i })).toBeInTheDocument();
    const addBtn = screen.getByRole('button', { name: 'Add' });
    expect(addBtn).toBeInTheDocument();

    // Clicking "Add" launches the programs form in a workspace
    userEvent.click(addBtn);
    expect(mockAttach).toHaveBeenCalledWith('patient-chart-workspace-slot', 'patient-allergy-form-workspace');
  });

  it('renders an empty state view if allergy data is unavailable', async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: [] });
    renderAllergiesSummary();

    await waitForLoadingToFinish();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /allergies/i })).toBeInTheDocument();
    expect(screen.getByText(/There are no allergy intolerances to display for this patient/i)).toBeInTheDocument();
    expect(screen.getByText(/Record allergy intolerances/i)).toBeInTheDocument();
  });

  it('renders an error state view if there was a problem fetching allergies data', async () => {
    const error = {
      message: 'You are not logged in',
      response: {
        status: 401,
        statusText: 'Unauthorized',
      },
    };

    cache.clear();
    mockOpenmrsFetch.mockRejectedValueOnce(error);
    renderAllergiesSummary();

    await waitForLoadingToFinish();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /allergies/i })).toBeInTheDocument();
    expect(screen.getByText(/Error 401: Unauthorized/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Sorry, there was a problem displaying this information. You can try to reload this page, or contact the site administrator and quote the error code above/i,
      ),
    ).toBeInTheDocument();
  });
});
