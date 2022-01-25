import React from 'react';
import { render, screen } from '@testing-library/react';
import DeceasedBannerTag from './deceased-tag.component';
import { mockDeceasedPatient } from '../../../../__mocks__/mockDeceasedPatient';
import { mockPatient } from '../../../../__mocks__/patient.mock';
import { formatDatetime } from '@openmrs/esm-framework';
import dayjs from 'dayjs';

const mockFormatDateTime = formatDatetime as jest.Mock;

jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');

  return {
    ...originalModule,
    formatDatetime: jest.fn(),
  };
});

describe('deceasedTag', () => {
  beforeEach(() => {
    mockFormatDateTime.mockImplementation((dateTime) => dayjs(dateTime).format('DD-MMM-YYYY HH:mm'));
  });
  it('renders a deceased tag in the patient banner for patients who died', () => {
    render(<DeceasedBannerTag patient={mockDeceasedPatient} />);
    expect(screen.getByRole('tooltip', { name: / 04-Apr-1972 00:00/i }));
    expect(screen.getByRole('button', { name: /Deceased/ })).toBeInTheDocument();
  });

  it('doesnot render Deceased tag for patients who are still alive', () => {
    render(<DeceasedBannerTag patient={mockPatient} />);
    expect(screen.queryByRole('tooltip', { name: / 04-Apr-1972 00:00/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Deceased/ })).not.toBeInTheDocument();
  });
});
