import type { ViewDagNode } from "./dag-view-types";
import type { LoroDoc } from "loro-crdt";

export function convertSyncStepsToNodes(
    doc: LoroDoc
): { nodes: ViewDagNode[]; frontiers: string[] } {
    const frontiers = doc.oplogFrontiers();
    const stack = frontiers.concat();
    const nodes: ViewDagNode[] = [];
    const visited = new Set<string>();
    const processedIds = new Set<string>();
    
    // Build an ordered list of nodes using DFS
    while (stack.length > 0) {
        const top = stack.pop()!;
        const change = doc.getChangeAt(top);
        
        const nodeId = idToString({ 
            peer: change.peer, 
            counter: top.counter
        });
        
        if (!processedIds.has(nodeId)) {
            processedIds.add(nodeId);
            
            const deps = change.deps.map(idToString);
            
            nodes.push({
                id: nodeId,
                deps,
                lamport: change.lamport,
                message: `Change at ${change.counter} (length: ${change.length})`,
                // author: change.peer || '',
                timestamp: change.timestamp ? change.timestamp * 1000 : Date.now()
            });

            for (const dep of change.deps) {
                const depId = idToString(dep);
                if (!visited.has(depId)) {
                    stack.push(dep);
                    visited.add(depId);
                }
            }
        }
    }

    return {nodes: nodes, frontiers: frontiers.map(idToString)};
}

export function idToString(id: { peer: string; counter: number }): string {
    return `${id.counter}@${id.peer}`;
}
