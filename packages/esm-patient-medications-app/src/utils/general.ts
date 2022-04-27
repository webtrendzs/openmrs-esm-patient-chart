import { first, remove } from "lodash";

/* 
 Pick one encounter from a set of encounters that are grouped by encounter type
*/
export function pickValidEncounter(encounters: Array<any>) {
    // pick only one
    const encounter = first(remove(encounters, encounter => encounter.data.results.length > 0))
    return  encounter? first(encounter.data?.results) : null;
  }