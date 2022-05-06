import { first, remove, orderBy } from "lodash";

/* 
 Pick one encounter from a set of encounters that are grouped by encounter type
*/
export function pickValidEncounter(encounters: Array<any>) {
    // pick only the recent one
    const validEncounters = orderBy(remove(encounters, 
      encounter => encounter.data.results.length > 0).map(enc => first(enc.data?.results)),
      'encounterDatetime', 'desc');

    return  validEncounters.length > 0? first(validEncounters) : null;
  }