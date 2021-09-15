import { openmrsFetch } from '@openmrs/esm-framework';
import { getImmunizationsConceptSet, performPatientImmunizationsSearch } from './immunizations.resource';
import { mockPatientImmunizationsSearchResponse } from '../../../../__mocks__/immunizations.mock';
import { FHIRImmunizationBundle, OpenmrsConcept } from './immunization-domain';

const mockOpenMRSFetch = openmrsFetch as jest.Mock;

jest.unmock('@openmrs/esm-framework');

describe('<ImmunizationResource />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should fetch immunization concept set by concept uuid', async () => {
    mockOpenMRSFetch.mockReturnValue(
      Promise.resolve({
        data: {
          results: [
            {
              uuid: 'conceptSetUuid',
              display: 'conceptSetName',
              setMembers: [
                { uuid: 'member1Uuid', display: 'member1Name' },
                { uuid: 'member2Uuid', display: 'member2Name' },
              ],
            },
          ],
        },
      }),
    );

    const ac = new AbortController();
    const immunizationsConceptSet: OpenmrsConcept = await getImmunizationsConceptSet('conceptSetUuid:some-uuid', ac);

    expect(immunizationsConceptSet.uuid).toBe('conceptSetUuid');
    expect(immunizationsConceptSet.display).toBe('conceptSetName');
    expect(immunizationsConceptSet.setMembers.length).toBe(2);

    expect(mockOpenMRSFetch).toHaveBeenCalledTimes(1);
    expect(mockOpenMRSFetch).toHaveBeenCalledWith(
      '/ws/rest/v1/concept?source=conceptSetUuid&code=some-uuid&v=full',
      expect.anything(),
    );
  });

  it('should fetch immunization concept set by mapping', async () => {
    mockOpenMRSFetch.mockResolvedValueOnce({
      data: {
        results: [
          {
            uuid: 'conceptSetUuid',
            display: 'conceptSetName',
            setMembers: [
              { uuid: 'member1Uuid', display: 'member1Name' },
              { uuid: 'member2Uuid', display: 'member2Name' },
            ],
          },
        ],
      },
    });

    const abortController = new AbortController();
    const immunizationsConceptSet: OpenmrsConcept = await getImmunizationsConceptSet('CIEL:12345', abortController);

    expect(immunizationsConceptSet.uuid).toBe('conceptSetUuid');
    expect(immunizationsConceptSet.display).toBe('conceptSetName');
    expect(immunizationsConceptSet.setMembers.length).toBe(2);

    expect(mockOpenMRSFetch).toHaveBeenCalledTimes(1);
    const mockCalls = mockOpenMRSFetch.mock.calls[0];
    expect(mockCalls[0]).toBe('/ws/rest/v1/concept?source=CIEL&code=12345&v=full');
  });

  it('should fetch immiunization bundles for a given patient', async () => {
    mockOpenMRSFetch.mockResolvedValueOnce({
      data: mockPatientImmunizationsSearchResponse,
    });

    const abortController = new AbortController();
    const fhirImmunizationBundle: FHIRImmunizationBundle = await performPatientImmunizationsSearch(
      '12345',
      'patientUuid',
      abortController,
    );

    expect(mockOpenMRSFetch).toHaveBeenCalledTimes(1);
    expect(fhirImmunizationBundle.resourceType).toBe('Bundle');
    expect(fhirImmunizationBundle.entry.length).toBe(6);
    expect(fhirImmunizationBundle.entry[0].resource.vaccineCode.coding[0].display).toBe('Rotavirus');
    expect(fhirImmunizationBundle.entry[1].resource.vaccineCode.coding[0].display).toBe('Rotavirus');
    expect(fhirImmunizationBundle.entry[2].resource.vaccineCode.coding[0].display).toBe('Polio');
    expect(fhirImmunizationBundle.entry[3].resource.vaccineCode.coding[0].display).toBe('Polio');
    expect(fhirImmunizationBundle.entry[4].resource.vaccineCode.coding[0].display).toBe('Influenza');
  });
});
