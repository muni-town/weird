import type { DagNode } from './dag-view';

export interface ViewDagNode extends DagNode {
	message?: string;
	author?: string;
	timestamp?: number;
}
