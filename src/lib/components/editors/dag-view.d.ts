export interface DagNode {
    id: string;
    deps: string[];
    lamport: number;
}

export interface DagView {
    rows: Row[];
}

export interface HistoryItem {
    node: DagNode;
    tid: number;
}

export interface Row {
    active: HistoryItem;
    active_index: number;
    /// If a node in input has `dep_on_this`, we need to connect it to the active thread.
    ///
    /// If it's not empty, it must contain the current active item's tid.
    input: Thread[];
    /// The current tids in the row. It must include the current active item's tid.
    cur_tids: number[];
    /// If a node in output has `dep_on_this`, we need to connect it to the active thread.
    output: Thread[];
}

interface Thread {
    tid: number;
    deps: string[];
    dep_on_active: boolean;
}

export function visualize(
    find: (id: string) => DagNode | undefined,
    frontiers: string[],
): DagView;
