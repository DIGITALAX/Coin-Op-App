import { useMemo } from 'react';
import { ComfyUIWorkflow, Connection, ConnectionPoint, RenderNode } from '../types/comfyui.types';

export const useConnectionRenderer = (workflow: ComfyUIWorkflow | null, renderNodes: RenderNode[]) => {
  const connections = useMemo(() => {
    if (!workflow?.connections || !renderNodes.length) return [];
    return workflow.connections.map((connection, index) => {
      const fromNode = renderNodes.find(n => n.id === connection.from_node);
      const toNode = renderNodes.find(n => n.id === connection.to_node);
      if (!fromNode || !toNode) return null;
      const outputPort = fromNode.outputPorts.find(port => port.id === `${fromNode.id}_out_${connection.from_output}`);
      if (!outputPort) return null;
      const inputPort = toNode.inputPorts.find(port => port.name === connection.to_input);
      if (!inputPort) return null;
      const from: ConnectionPoint = {
        x: fromNode.position[0] + outputPort.position.x,
        y: fromNode.position[1] + outputPort.position.y
      };
      const to: ConnectionPoint = {
        x: toNode.position[0] + inputPort.position.x,
        y: toNode.position[1] + inputPort.position.y
      };
      const controlX = from.x + (to.x - from.x) * 0.5;
      const path = `M ${from.x} ${from.y} C ${controlX} ${from.y}, ${controlX} ${to.y}, ${to.x} ${to.y}`;
      return {
        id: `connection-${index}`,
        from,
        to,
        path
      } as Connection;
    }).filter(Boolean) as Connection[];
  }, [workflow, renderNodes]);
  return { connections };
};