import React from 'react';
import { cache } from 'swr';
import { screen } from '@testing-library/react';
import { attach, openmrsFetch } from '@openmrs/esm-framework';
import { mockPatient } from '../../../../__mocks__/patient.mock';
import { mockPatientEncountersRESTAPI } from '../../../../__mocks__/encounters.mock';
import NotesDetailedSummary from './notes-detailed-summary.component';
import { render, waitForLoadingToFinish } from '../../../../tools/app-test-utils';

const testProps = {
  basePath: '/',
  patient: mockPatient,
  patientUuid: mockPatient.id,
  showAddNote: false,
};

const mockAttach = attach as jest.Mock;
const mockOpenmrsFetch = openmrsFetch as jest.Mock;
mockOpenmrsFetch.mockImplementation(jest.fn());

jest.mock('@openmrs/esm-framework', () => ({
  openmrsFetch: jest.fn(),
  useVisit: jest.fn().mockReturnValue({ currentVisit: null }),
}));

function renderNotesSummary() {
  render(<NotesDetailedSummary {...testProps} />);
}

describe('NotesDetailedSummary: ', () => {
  it('renders an empty state view if encounter data is unavailable', async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [] } });
    renderNotesSummary();

    await waitForLoadingToFinish();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByText(/There are no notes to display for this patient/i)).toBeInTheDocument();
    expect(screen.getByText(/Record notes/i)).toBeInTheDocument();
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
    renderNotesSummary();

    await waitForLoadingToFinish();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByText(/Error 401: Unauthorized/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Sorry, there was a problem displaying this information. You can try to reload this page, or contact the site administrator and quote the error code above/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders an overview of the patient's encounters when present", async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: mockPatientEncountersRESTAPI });
    renderNotesSummary();

    await waitForLoadingToFinish();
    expect(screen.getByRole('heading', { name: /notes/i })).toBeInTheDocument();
    const expectedColumnHeaders = [/Date/, /encounter type/, /location/, /author/];
    expectedColumnHeaders.forEach((header) => {
      expect(screen.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeInTheDocument();
    });

    expect(screen.getAllByRole('row').length).toEqual(6);
    expect(screen.getByText(/1–5 of 24 items/)).toBeInTheDocument();
  });
});
