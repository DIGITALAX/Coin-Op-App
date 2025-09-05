import { KSamplerNodeProps } from "../../types/comfyui.types";
import NodeInput from "../inputs/NodeInput";
import NodePorts from "../common/NodePorts";
export default function KSamplerNode({
  node,
  onInputChange,
}: KSamplerNodeProps) {
  const width = Math.max(node.size.width, 400);
  const height = Math.max(node.size.height, 400);
  return (
    <div
      className="bg-red-600 border-2 border-red-400 rounded-lg shadow-lg relative w-full flex flex-col items-center"
      style={{
        width: width,
        minHeight: height,
      }}
    >
      <NodePorts node={node} />
      <div className="bg-red-700 w-full px-3 py-2 rounded-t-lg">
        <h3 className="font-mana text-xxxs text-white font-bold">
          {node.title}
        </h3>
        <p className="font-mana text-xxxs text-red-200 opacity-75">
          {node.class_type}
        </p>
      </div>
      <div className="p-3 w-3/4 space-y-2 overflow-y-auto">
        {node.inputs.seed && !Array.isArray(node.inputs.seed) && (
          <NodeInput
            name="seed"
            type="INT"
            value={node.inputs.seed}
            connected={false}
            onChange={(value) => onInputChange("seed", value)}
          />
        )}
        {node.inputs.steps && !Array.isArray(node.inputs.steps) && (
          <NodeInput
            name="steps"
            type="INT"
            value={node.inputs.steps}
            connected={false}
            onChange={(value) => onInputChange("steps", value)}
          />
        )}
        {node.inputs.cfg && !Array.isArray(node.inputs.cfg) && (
          <NodeInput
            name="cfg"
            type="FLOAT"
            value={node.inputs.cfg}
            connected={false}
            onChange={(value) => onInputChange("cfg", value)}
          />
        )}
        {node.inputs.sampler_name && !Array.isArray(node.inputs.sampler_name) && (
          <NodeInput
            name="sampler_name"
            type="COMBO"
            value={node.inputs.sampler_name}
            connected={false}
            onChange={(value) => onInputChange("sampler_name", value)}
          />
        )}
        {node.inputs.scheduler && !Array.isArray(node.inputs.scheduler) && (
          <NodeInput
            name="scheduler"
            type="COMBO"
            value={node.inputs.scheduler}
            connected={false}
            onChange={(value) => onInputChange("scheduler", value)}
          />
        )}
        <NodeInput
          name="denoise"
          type="FLOAT"
          value={node.inputs.denoise || 1.0}
          connected={false}
          onChange={(value) => onInputChange("denoise", value)}
        />
      </div>
    </div>
  );
}
