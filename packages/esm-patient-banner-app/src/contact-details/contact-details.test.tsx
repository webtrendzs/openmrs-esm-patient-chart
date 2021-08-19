import React from 'react';
import { cache } from 'swr';
import { screen } from '@testing-library/react';
import ContactDetails from './contact-details.component';
import { openmrsFetch } from '@openmrs/esm-framework';
import { render, waitForLoadingToFinish } from '../../../../tools/app-test-utils';

const mockOpenmrsFetch = openmrsFetch as jest.Mock;
mockOpenmrsFetch.mockImplementation(jest.fn());

const testProps = {
  address: [
    {
      city: 'Foo',
      country: 'Bar',
      id: '0000',
      postalCode: '00100',
      state: 'Quux',
      use: 'home',
    },
  ],
  telecom: [{ value: '+0123456789' }],
  patientId: '1111',
};

function renderContactDetails() {
  render(<ContactDetails {...testProps} />);
}

describe('ContactDetails: ', () => {
  it("displays the patient's relationships and contact details", async () => {
    cache.clear();

    mockOpenmrsFetch.mockResolvedValueOnce({
      data: {
        results: [
          {
            uuid: 2222,
            personA: {
              person: { display: 'Amanda Testerson', age: 30 },
              uuid: 2222,
            },
            relationshipType: { aIsToB: 'Cousin' },
          },
        ],
      },
    });

    renderContactDetails();

    await waitForLoadingToFinish();

    expect(screen.getByText('Relationships'));
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByText('Amanda Testerson')).toBeInTheDocument();
    expect(screen.getByText(/Cousin/i)).toBeInTheDocument();
  });
});
