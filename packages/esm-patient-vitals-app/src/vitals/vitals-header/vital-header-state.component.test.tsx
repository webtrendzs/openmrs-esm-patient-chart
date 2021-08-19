import React from 'react';
import { of } from 'rxjs';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VitalHeader from './vital-header-state.component';
import { performPatientsVitalsSearch, useVitalsConceptMetadata } from '../vitals.resource';
import { mockPatient } from '../../../../../__mocks__/patient.mock';
import { useConfig } from '@openmrs/esm-framework';
dayjs.extend(isToday);

const mockVitalsConfig = {
  concepts: {
    systolicBloodPressureUuid: '5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    diastolicBloodPressureUuid: '5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    pulseUuid: '5087AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    temperatureUuid: '5088AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    oxygenSaturationUuid: '5092AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    heightUuid: '5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    weightUuid: '5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    respiratoryRateUuid: '5242AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  biometrics: {
    bmiUnit: 'kg / m²',
  },
};

const mockVitals = [
  {
    id: 'bca4d5f1-ee6a-4282-a5ff-c8db12c4247c',
    date: '2020-11-27T09:06:13.000+00:00',
    systolic: 120,
    diastolic: 80,
    temperature: 36.5,
    oxygenSaturation: 88,
    weight: 85,
    height: 185,
    bmi: '24.8',
    respiratoryRate: 45,
  },
];

const mockPerformPatientsVitalSearch = performPatientsVitalsSearch as jest.Mock;
const mockUseVitalsConceptMetadata = useVitalsConceptMetadata as jest.Mock;
const mockUseConfig = useConfig as jest.Mock;
mockUseConfig.mockImplementation(() => mockVitalsConfig);

jest.mock('../vitals.resource', () => ({
  ...(jest.requireActual('../vitals.resource') as any),
  performPatientsVitalsSearch: jest.fn(),
  useVitalsSignsConceptMetaData: jest.fn().mockImplementation(() => ({
    conceptsUnits: ['mmHg', 'mmHg', '°C', 'cm', 'kg', 'beats/min', '%', 'cm', null],
  })),
}));

const testProps = {
  patientUuid: mockPatient.id,
  showRecordVitals: true,
};

function renderVitalsHeaderState() {
  render(<VitalHeader {...testProps} />);
}

describe('VitalsHeaderState: ', () => {
  it('renders the vitals header', () => {
    mockPerformPatientsVitalSearch.mockReturnValue(of(mockVitals));
    renderVitalsHeaderState();

    expect(screen.getByText(/Vitals & Biometrics/i)).toBeInTheDocument();
    expect(screen.getByText(/Last recorded: 27 - Nov - 2020/i)).toBeInTheDocument();
    expect(screen.getByTitle(/warningfilled/i)).toBeInTheDocument();
    expect(screen.getByText(/Record Vitals/)).toBeInTheDocument();
    expect(screen.queryByText(/Temp/i)).not.toBeInTheDocument();
    const chevronDown = screen.getByTitle(/ChevronDown/);
    userEvent.click(chevronDown);
    expect(screen.getByText(/Temp/i)).toBeInTheDocument();
    expect(screen.getByText(/Heart Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/SPO2/i)).toBeInTheDocument();
    expect(screen.getAllByText(/R. Rate/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Height/i)).toBeInTheDocument();
    expect(screen.getByText(/BMI/i)).toBeInTheDocument();
    expect(screen.getByText(/Weight/i)).toBeInTheDocument();
  });
});
