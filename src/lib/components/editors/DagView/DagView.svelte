<script context="module" lang="ts">
	import { visualize, type DagNode, type Row, type Thread } from "./dag-view";
	
	export interface ViewDagNode extends DagNode {
	  message?: string;
	  author?: string;
	  timestamp?: number;
	}
  </script>
  
  <script lang="ts">
	import "./DagView.css";
  
	export let nodes: ViewDagNode[];
	export let frontiers: string[];
  
	const CELL_SIZE = 24;
	const NODE_RADIUS = 5;
  
	$: view = (() => {
	  const map = new Map<string, DagNode>();
	  for (const node of nodes) {
		map.set(node.id, node);
	  }
	  return visualize(id => map.get(id), frontiers);
	})();
  
	function renderConnection(
	  type: 'input' | 'output',
	  xFrom: number,
	  xTo: number,
	  y: number,
	  tid: number
	): string {
	  const startX = xFrom * CELL_SIZE / 2 + CELL_SIZE / 4;
	  const endX = xTo * CELL_SIZE / 2 + CELL_SIZE / 4;
	  const startY = type === 'input' ? y : y + CELL_SIZE / 2;
	  const endY = type === 'input' ? y + CELL_SIZE / 2 : y;
  
	  let path = "";
	  if (startX > endX) {
		const controlPoint1X = startX;
		const controlPoint1Y = endY;
		const controlPoint2X = endX;
		const controlPoint2Y = startY;
		path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
	  } else {
		const controlPoint1X = startX;
		const controlPoint1Y = endY;
		const controlPoint2X = startX;
		const controlPoint2Y = endY;
		path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
	  }
  
	  return path;
	}
  
	function tidToColor(tid: number): string {
	  const hue = (tid * 137.508) % 360;
	  const saturation = 70 + (tid % 30);
	  const lightness = 45 + (tid % 20);
	  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	}
  
	function renderConnections(row: Row, type: 'input' | 'output', y: number) {
	  const ans: { path: string; tid: number }[] = [];
	  row[type].forEach((thread: Thread, i: number) => {
		const connectionA = row.cur_tids.indexOf(thread.tid);
		const connectionB = thread.dep_on_active ? row.active_index : -1;
		if (connectionA >= 0) {
		  ans.push({
			path: renderConnection(type, i, connectionA, y, thread.tid),
			tid: thread.tid
		  });
		}
		if (connectionB >= 0) {
		  ans.push({
			path: renderConnection(type, i, connectionB, y, thread.tid),
			tid: thread.tid
		  });
		}
	  });
	  return ans;
	}
  
	function renderRow(row: Row, rowIndex: number, backgroundColor: string) {
	  const y = CELL_SIZE / 2;
	  const inputConn = renderConnections(row, 'input', y - CELL_SIZE / 2);
	  const outputConn = renderConnections(row, 'output', y);
	  const width = (Math.max(row.cur_tids.length, row.output.length, row.input.length)) * CELL_SIZE / 2 + 8;
  
	  return {
		width,
		inputConn,
		outputConn,
		row,
		y
	  };
	}
  </script>
  
  <div class="history-content">
	{#each view.rows as row, index}
	  {@const rowContent = renderRow(row, index, 'white')}
	  <div style="position: relative; height: {CELL_SIZE}px; display: flex; flex-direction: row; align-items: center">
		<svg width={rowContent.width} height={CELL_SIZE}>
		  {#each rowContent.inputConn as conn}
			<path d={conn.path} fill="none" stroke={tidToColor(conn.tid)} stroke-width="2" />
		  {/each}
		  {#each rowContent.outputConn as conn}
			<path d={conn.path} fill="none" stroke={tidToColor(conn.tid)} stroke-width="2" />
		  {/each}
		  {#each row.cur_tids as tid, i}
			{#if tid === row.active.tid}
			  <circle
				cx={(i * CELL_SIZE) / 2 + CELL_SIZE / 4}
				cy={rowContent.y}
				r={NODE_RADIUS}
				fill="rgb(100, 100, 230)"
				stroke="white"
			  />
			{/if}
		  {/each}
		</svg>
		<div class="dag-view-message">
		  <span>
			{(row.active.node as ViewDagNode).message ?? row.active.node.id}
		  </span>
		  <span class="author">
			{(row.active.node as ViewDagNode).author}
		  </span>
		  <span class="timestamp">
			{#if (row.active.node as ViewDagNode).timestamp != null}
			  {new Date((row.active.node as ViewDagNode).timestamp!).toLocaleString()}
			{/if}
		  </span>
		</div>
	  </div>
	{/each}
  </div>
  
  <style>
	.dag-view-message {
	  font-size: 12px;
	  font-family: 'Helvetica Neue', Arial, sans-serif;
	  flex: 1;
	  min-width: 0;
	  display: flex;
	  align-items: center;
	  gap: 8px;
	}
  
	.dag-view-message > span {
	  white-space: nowrap;
	  overflow: hidden;
	  text-overflow: ellipsis;
	}
  
	.dag-view-message > span:first-child {
	  flex: 1;
	  min-width: 0;
	}
  
	.author {
	  color: #666;
	}
  
	.timestamp {
	  color: #999;
	}
  </style>
