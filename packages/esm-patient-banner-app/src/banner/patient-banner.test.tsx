import React from 'react';
import { render, screen } from '@testing-library/react';
import { age } from '@openmrs/esm-framework';
import { mockPatient } from '../../../../__mocks__/patient.mock';
import PatientBanner from './patient-banner.component';
import userEvent from '@testing-library/user-event';

const mockAge = age as jest.Mock;

jest.mock('@openmrs/esm-framework', () => ({
  ...(jest.requireActual('@openmrs/esm-framework') as any),
  age: jest.fn(),
}));

const testProps = {
  patient: mockPatient,
  patientUuid: mockPatient.id,
};

function renderPatientBanner() {
  render(<PatientBanner {...testProps} />);
}

describe('PatientBanner: ', () => {
  it(`renders the patient's avatar, name, identifiers, demographics, contact details and relationships when available`, async () => {
    mockAge.mockReturnValueOnce('49 years');
    renderPatientBanner();

    expect(screen.getByText(/John Wilson/i)).toBeInTheDocument();
    expect(screen.getByText(/04 - Apr - 1972/i)).toBeInTheDocument();
    expect(screen.getByText(/100732HE, 100GEJ/i)).toBeInTheDocument();
    const showAllDetailsBtn = screen.getByRole('button', { name: /show all details/i });
    expect(showAllDetailsBtn).toBeInTheDocument();

    userEvent.click(showAllDetailsBtn);
    await screen.findByText(/hide all details/i);
    expect(screen.getByLabelText(/toggle contact details/i)).toBeInTheDocument();
    expect(screen.getByText(/address/i)).toBeInTheDocument();
    expect(screen.getByText(/60351/i)).toBeInTheDocument();
    expect(screen.getByText(/City0351/i)).toBeInTheDocument();
    expect(screen.getByText(/State0351tested/i)).toBeInTheDocument();
    expect(screen.getByText(/Country0351/i)).toBeInTheDocument();
    expect(screen.getByText(/contact details/i)).toBeInTheDocument();
    expect(screen.getByText(/\+25467388299499/i)).toBeInTheDocument();
    expect(screen.getByText(/relationships/i)).toBeInTheDocument();
  });
});
