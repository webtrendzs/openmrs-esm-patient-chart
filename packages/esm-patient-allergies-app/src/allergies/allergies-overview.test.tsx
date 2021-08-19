import React from 'react';
import { cache } from 'swr';
import { screen } from '@testing-library/react';
import { attach, openmrsFetch } from '@openmrs/esm-framework';
import { mockFhirAllergyIntoleranceResponse } from '../../../../__mocks__/allergies.mock';
import { mockPatient } from '../../../../__mocks__/patient.mock';
import { render, waitForLoadingToFinish } from '../../../../tools/app-test-utils';
import AllergiesOverview from './allergies-overview.component';
import userEvent from '@testing-library/user-event';

const testProps = {
  patient: mockPatient,
  basePath: '/',
  showAddAllergy: false,
};

const mockAttach = attach as jest.Mock;
const mockOpenmrsFetch = openmrsFetch as jest.Mock;
mockOpenmrsFetch.mockImplementation(jest.fn());

function renderAllergiesOverview() {
  render(<AllergiesOverview {...testProps} />);
}

describe('AllergiesOverview: ', () => {
  it("renders an overview of the patient's allergic reactions and their manifestations", async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: mockFhirAllergyIntoleranceResponse });
    renderAllergiesOverview();

    await waitForLoadingToFinish();

    expect(screen.getByRole('heading', { name: /allergies/i })).toBeInTheDocument();
    const expectedColumnHeaders = [/name/, /reactions/];
    const expectedAllergies = [
      /ACE inhibitors Anaphylaxis \(moderate\)/,
      /Aspirin Mental status change \(severe\)/,
      /Fish Anaphylaxis, Angioedema, Fever, Hives \(mild\)/,
      /Morphine Mental status change \(severe\)/,
      /Penicillins Diarrhea, Cough, Musculoskeletal pain, Mental status change, Angioedema \(Severe\)/,
    ];
    expect(screen.getByRole('heading', { name: /allergies/i })).toBeInTheDocument();
    expectedColumnHeaders.forEach((header) => {
      expect(screen.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeInTheDocument();
    });
    expectedAllergies.forEach((allergy) => {
      expect(screen.getByRole('row', { name: new RegExp(allergy, 'i') })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
    testProps.showAddAllergy = true;
    renderAllergiesOverview();
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
    renderAllergiesOverview();

    await waitForLoadingToFinish();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /allergies/i })).toBeInTheDocument();
    expect(screen.getByText(/There are no allergy intolerances to display for this patient/i)).toBeInTheDocument();
    expect(screen.getByText(/Record allergy intolerances/i)).toBeInTheDocument();
  });

  it('renders an error state view if there is a problem fetching allergies data', async () => {
    const error = {
      message: 'You are not logged in',
      response: {
        status: 401,
        statusText: 'Unauthorized',
      },
    };

    cache.clear();
    mockOpenmrsFetch.mockRejectedValueOnce(error);
    renderAllergiesOverview();

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
