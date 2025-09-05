import { useNodeCanvas } from "../hooks/useNodeCanvas";
import { useConnectionRenderer } from "../hooks/useConnectionRenderer";
import NodeFactory from "./NodeFactory";
import { ComfyUINodeEditorProps } from "../types/comfyui.types";
import useWorkflow from "../hooks/useWorkflow";
import { useComfyUI } from "../hooks/useComfyUI";
export default function ComfyUINodeEditor({
  workflowJson,
  onWorkflowChange,
  comfyUrl,
}: ComfyUINodeEditorProps) {
  const { parseWorkflow } = useComfyUI();
  const {
    containerRef,
    workflow,
    renderNodes,
    canvasState,
    loadWorkflow,
    resetView,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleNodeInputChange,
    handleNodeMouseDown,
  } = useNodeCanvas();
  const { error, loading, deleteWorkflow, setError } = useWorkflow(
    loadWorkflow,
    workflowJson,
    onWorkflowChange,
    resetView,
    workflow,
    parseWorkflow
  );
  const { connections } = useConnectionRenderer(workflow, renderNodes);
  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      <div className="flex items-center gap-3 p-3 bg-gris border-b border-ama">
        <div
          onClick={resetView}
          className="px-3 py-1.5 bg-gris text-white rounded font-mana text-xxxs hover:opacity-70"
        >
          Reset View
        </div>
        {workflow && (
          <div
            onClick={deleteWorkflow}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-mana text-xxxs cursor-pointer transition-colors"
          >
            Delete Workflow
          </div>
        )}
        {workflow && (
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-white font-mana text-xxxs">
              Nodes: {workflow.nodes.length}
            </span>
            <span className="text-white font-mana text-xxxs">
              Connections: {workflow.connections?.length || 0}
            </span>
            <span className="text-white font-mana text-xxxs">
              Zoom: {Math.round(canvasState.zoom * 100).toFixed(0)}%
            </span>
            <span className="text-white font-mana text-xxxs">
              Pan: {Math.round(canvasState.pan.x)},{" "}
              {Math.round(canvasState.pan.y)}
            </span>
          </div>
        )}
      </div>
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-white font-mana">
            <div className="animate-spin w-8 h-8 border-2 border-ama border-t-transparent rounded-full mx-auto mb-2"></div>
            Parsing Workflow...
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-900 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-red-200 font-mana text-sm">Error</p>
              <p className="text-red-300 text-xs mt-1">{error}</p>
            </div>
            <div
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-200"
            >
              ×
            </div>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-gray-900 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
            transformOrigin: "0 0",
            position: "absolute",
            top: 0,
            left: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
            width: "4000px",
            height: "4000px",
          }}
        >
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {connections.map((connection) => (
              <path
                key={connection.id}
                d={connection.path}
                stroke="#4ade80"
                strokeWidth="2"
                fill="none"
                opacity="0.6"
              />
            ))}
          </svg>
          {renderNodes.map((node) => (
            <div
              key={node.id}
              data-node-id={node.id}
              style={{
                position: "absolute",
                left: node.position[0],
                top: node.position[1],
                zIndex: 2,
                cursor: "move",
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              <NodeFactory
                node={node}
                onInputChange={handleNodeInputChange}
                comfyUrl={comfyUrl}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
