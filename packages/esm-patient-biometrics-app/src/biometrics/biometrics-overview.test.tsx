import React from 'react';
import { cache } from 'swr';
import { screen } from '@testing-library/react';
import { attach, openmrsFetch, useConfig } from '@openmrs/esm-framework';
import BiometricsOverview from './biometrics-overview.component';
import { render, waitForLoadingToFinish } from '../../../../tools/app-test-utils';
import { mockPatient } from '../../../../__mocks__/patient.mock';
import { mockBiometricsResponse } from '../../../../__mocks__/biometrics.mock';

const mockBiometricsConfig = {
  biometrics: { bmiUnit: 'kg / m²' },
  concepts: { heightUuid: '5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', weightUuid: '5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
};

const mockAttach = attach as jest.Mock;
const mockUseConfig = useConfig as jest.Mock;
const mockOpenmrsFetch = openmrsFetch as jest.Mock;
mockUseConfig.mockImplementation(() => mockBiometricsConfig);
mockOpenmrsFetch.mockImplementation(jest.fn());

const testProps = {
  showAddBiometrics: true,
  patientUuid: mockPatient.id,
};

function renderBiometricsOverview() {
  render(<BiometricsOverview {...testProps} />);
}

describe('BiometricsOverview: ', () => {
  it('renders an empty state view if biometrics data is unavailable', async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: [] });
    renderBiometricsOverview();

    await waitForLoadingToFinish();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /biometrics/i })).toBeInTheDocument();
    expect(screen.getByText(/There are no biometrics to display for this patient/i)).toBeInTheDocument();
    expect(screen.getByText(/Record biometrics/i)).toBeInTheDocument();
  });

  it('renders an error state view if there is a problem fetching biometrics data', async () => {
    const error = {
      message: 'You are not logged in',
      response: {
        status: 401,
        statusText: 'Unauthorized',
      },
    };

    cache.clear();
    mockOpenmrsFetch.mockRejectedValueOnce(error);
    renderBiometricsOverview();

    await waitForLoadingToFinish();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /biometrics/i })).toBeInTheDocument();
    expect(screen.getByText(/Error 401: Unauthorized/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Sorry, there was a problem displaying this information. You can try to reload this page, or contact the site administrator and quote the error code above/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders an overview of the patient's vital signs", async () => {
    cache.clear();
    mockOpenmrsFetch.mockReturnValueOnce({ data: mockBiometricsResponse });
    renderBiometricsOverview();

    await waitForLoadingToFinish();
    expect(screen.getByRole('heading', { name: /biometrics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /table view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chart view/i })).toBeInTheDocument();

    const expectedColumnHeaders = [/date/, /weight/, /height/, /bmi/];

    expectedColumnHeaders.map((header) =>
      expect(screen.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeInTheDocument(),
    );

    const expectedTableRows = [
      /18 - Jun - 2021 80 198 20.4/,
      /10 - Jun - 2021 50/,
      /26 - May - 2021 61 160 23.8/,
      /10 - May - 2021 90 198 23.0/,
      /08 - Apr - 2021 67 172 22.6/,
    ];

    expectedTableRows.map((row) => expect(screen.getByRole('row', { name: new RegExp(row, 'i') })).toBeInTheDocument());
  });
});
