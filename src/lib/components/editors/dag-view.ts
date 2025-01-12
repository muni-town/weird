export interface DagNode {
  id: string;
  deps: string[];
}

export interface Thread {
  tid: number;
  dep_on_active: boolean;
}

export interface Row {
  active: { node: DagNode; tid: number };
  active_index: number;
  cur_tids: number[];
  input: Thread[];
  output: Thread[];
}

export function visualize(
  getNode: (id: string) => DagNode | undefined,
  frontiers: string[]
): { rows: Row[] } {
  const rows: Row[] = [];
  const visited = new Set<string>();
  const processedIds = new Set<string>();
  const stack = [...frontiers];

  while (stack.length > 0) {
    const id = stack.pop()!;
    const node = getNode(id);
    
    if (node && !processedIds.has(node.id)) {
      processedIds.add(node.id);
      
      const row: Row = {
        active: { node, tid: rows.length },
        active_index: rows.length,
        cur_tids: [rows.length],
        input: [],
        output: []
      };

      // 处理依赖关系
      node.deps.forEach((depId, index) => {
        if (!visited.has(depId)) {
          stack.push(depId);
          visited.add(depId);
        }
        row.input.push({ tid: index, dep_on_active: true });
      });

      rows.push(row);
    }
  }

  return { rows: rows.reverse() };
} 