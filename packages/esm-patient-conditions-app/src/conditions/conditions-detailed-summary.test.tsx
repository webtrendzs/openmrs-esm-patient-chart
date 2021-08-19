import React from 'react';
import { cache } from 'swr';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { attach, fhirBaseUrl, openmrsFetch } from '@openmrs/esm-framework';
import ConditionsDetailedSummary from './conditions-detailed-summary.component';
import { render, waitForLoadingToFinish } from '../../../../tools/app-test-utils';
import { mockFhirConditionsResponse } from '../../../../__mocks__/conditions.mock';
import { mockPatient } from '../../../../__mocks__/patient.mock';

const mockAttach = attach as jest.Mock;
const mockOpenmrsFetch = openmrsFetch as jest.Mock;
mockOpenmrsFetch.mockImplementation(jest.fn());

jest.mock('./conditions.context', () => ({
  useConditionsContext: jest.fn().mockImplementation(() => ({
    patient: mockPatient,
  })),
}));

function renderConditionsSummary() {
  render(<ConditionsDetailedSummary />);
}

describe('ConditionsDetailedSummary: ', () => {
  it('renders an empty state view if conditions data is unavailable', async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: [] });
    renderConditionsSummary();

    await waitForLoadingToFinish();
    expect(mockOpenmrsFetch).toHaveBeenCalledTimes(1);
    expect(mockOpenmrsFetch).toHaveBeenCalledWith(
      `${fhirBaseUrl}/Condition?patient.identifier=${mockPatient.identifier[0].value}`,
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /conditions/i })).toBeInTheDocument();
    expect(screen.getByText(/There are no conditions to display for this patient/i)).toBeInTheDocument();
    expect(screen.getByText(/Record conditions/i)).toBeInTheDocument();
  });

  it('renders an error state view if there is a problem fetching conditions data', async () => {
    const error = {
      message: 'You are not logged in',
      response: {
        status: 401,
        statusText: 'Unauthorized',
      },
    };

    cache.clear();
    mockOpenmrsFetch.mockRejectedValueOnce(error);
    renderConditionsSummary();

    await waitForLoadingToFinish();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /conditions/i })).toBeInTheDocument();
    expect(screen.getByText(/Error 401: Unauthorized/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Sorry, there was a problem displaying this information. You can try to reload this page, or contact the site administrator and quote the error code above/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders a detailed summary of the patient's conditions when present", async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: mockFhirConditionsResponse });
    renderConditionsSummary();

    await waitForLoadingToFinish();
    expect(screen.getByRole('heading', { name: /conditions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();

    const expectedColumnHeaders = [/condition/, /since/, /status/];
    expectedColumnHeaders.forEach((header) => {
      expect(screen.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeInTheDocument();
    });
    const expectedTableRows = [/hiv positive/, /malaria, confirmed/, /Malaria sevère/, /anaemia/];
    expectedTableRows.forEach((row) => {
      expect(screen.getByRole('row', { name: new RegExp(row, 'i') })).toBeInTheDocument();
    });
    expect(screen.getAllByRole('row').length).toEqual(9);
  });

  it('clicking the Add button or Record Conditions link launches the conditions form', async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: [] });
    renderConditionsSummary();

    await waitForLoadingToFinish();
    const recordConditionsLink = screen.getByText(/record conditions/i);
    userEvent.click(recordConditionsLink);
    expect(mockAttach).toHaveBeenCalledTimes(1);
    expect(mockAttach).toHaveBeenCalledWith('patient-chart-workspace-slot', 'conditions-form-workspace');
  });
});
