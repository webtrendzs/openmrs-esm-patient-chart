export interface Obs {
    uuid: string,
    display: string,
    concept: {
        uuid: string,
        display: string
    },
    groupMembers?:Array<{
        uuid: string,
        display: string,
        concept: any,
        value: any
    }>,
    value?: {
        uuid: string,
        display: string,
        answers: Array<any>,
        setMembers: Array<any>
    }
}

export function extractEncounterMedData(obs: Array<Obs>): any {
    const encounters = {};
    [`NHIF STATUS`, 
    `RETURN VISIT DATE`, 
    `CURRENT HYPERTENSION DRUGS USED FOR TREATMENT`,
    `TREATMENT STARTED, DETAILED`,
    `TYPE OF FOLLOW-UP`].forEach((_match)=>{
        encounters[_match]=obs.filter((ob) => (new RegExp(`${_match}:([\s]*.*)`, 'i')).exec(ob.display)!=null)
    });
    
    return encounters;
}