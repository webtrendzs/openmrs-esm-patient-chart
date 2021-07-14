import { Subject, Observable } from "rxjs";

const workspaceItem = new Subject<WorkspaceItem>();

/**
 * Only used in patient-chart
 * @param item
 * @category Workspace
 */
export function newWorkspaceItem(item: WorkspaceItem) {
  workspaceItem.next(item);
}

/**
 * Only used in patient-chart
 * @returns
 * @category Workspace
 */
export function getNewWorkspaceItem(): Observable<WorkspaceItem> {
  return workspaceItem.asObservable();
}

export interface WorkspaceItem {
  component: any;
  name: string;
  props: any;
  validations?: Function;
  inProgress: boolean;
  componentClosed?: Function;
}
