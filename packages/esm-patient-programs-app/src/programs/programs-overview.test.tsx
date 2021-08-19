import React from 'react';
import { cache } from 'swr';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { attach, openmrsFetch } from '@openmrs/esm-framework';
import { mockEnrolledProgramsResponse } from '../../../../__mocks__/programs.mock';
import { mockPatient } from '../../../../__mocks__/patient.mock';
import ProgramsOverview from './programs-overview.component';
import { render, waitForLoadingToFinish } from '../../../../tools/app-test-utils';

const mockAttach = attach as jest.Mock;
const mockOpenmrsFetch = openmrsFetch as jest.Mock;
mockOpenmrsFetch.mockImplementation(jest.fn());

const testProps = {
  basePath: '/',
  patientUuid: mockPatient.id,
};

function renderProgramsOverview() {
  render(<ProgramsOverview {...testProps} />);
}

describe('ProgramsOverview', () => {
  it("renders an overview of the patient's program enrollments when available", async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: mockEnrolledProgramsResponse } });
    renderProgramsOverview();

    await waitForLoadingToFinish();
    expect(screen.getByText(/Care Programs/i)).toBeInTheDocument();
    const addBtn = screen.getByRole('button', { name: 'Add' });
    expect(addBtn).toBeInTheDocument();
    expect(screen.getAllByText(/Active Programs/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Date enrolled/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/HIV Care and Treatment/i)[0]).toBeInTheDocument();

    // Clicking "Add" launches the programs form in a workspace
    userEvent.click(addBtn);
    expect(mockAttach).toHaveBeenCalledWith('patient-chart-workspace-slot', 'programs-workspace');
  });

  it('renders an empty state view when the patient is not enrolled into any programs', async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: { results: [] } });
    renderProgramsOverview();

    await waitForLoadingToFinish();
    expect(screen.getByText(/Care Programs/i)).toBeInTheDocument();
    expect(screen.getByText(/There are no program enrollments to display for this patient/)).toBeInTheDocument();
    expect(screen.getByText(/Record program enrollments/)).toBeInTheDocument();
  });

  it('renders an error state view if there is a problem fetching program enrollments', async () => {
    const error = {
      message: 'You are not logged in',
      response: {
        status: 401,
        statusText: 'Unauthorized',
      },
    };

    cache.clear();
    mockOpenmrsFetch.mockRejectedValueOnce(error);
    renderProgramsOverview();

    await waitForLoadingToFinish();
    expect(screen.getByText(/Care Programs/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Sorry, there was a problem displaying this information. You can try to reload this page, or contact the site administrator and quote the error code above./,
      ),
    ).toBeInTheDocument();
  });
});
