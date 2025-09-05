import NodeInput from "../inputs/NodeInput";
import { LoraLoaderNodeProps } from "../../types/comfyui.types";
import NodePorts from "../common/NodePorts";
export default function LoraLoaderNode({
  node,
  onInputChange,
  comfyUrl,
}: LoraLoaderNodeProps) {
  const width = Math.max(node.size.width, 280);
  const height = Math.max(node.size.height, 200);
  return (
    <div
      className="bg-purple-600 border-2 border-purple-400 rounded-lg shadow-lg relative"
      style={{
        width: width,
        minHeight: height,
      }}
    >
      <div className="bg-purple-700 px-3 py-2 rounded-t-lg">
        <h3 className="font-mana text-xxxs text-white font-bold">
          {node.title}
        </h3>
        <p className="font-mana text-xxxs text-purple-200 opacity-75">
          {node.class_type}
        </p>
      </div>
      <NodePorts node={node} />
      <div className="p-3 space-y-2">
        {node.inputs.lora_name && (
          <NodeInput
            name="lora_name"
            type="LORA_NAME"
            value={node.inputs.lora_name}
            connected={false}
            onChange={(value) => onInputChange("lora_name", value)}
            comfyUrl={comfyUrl}
          />
        )}
        {node.inputs.strength_model !== undefined && (
          <NodeInput
            name="strength_model"
            type="FLOAT"
            value={node.inputs.strength_model}
            connected={false}
            onChange={(value) => onInputChange("strength_model", value)}
          />
        )}
        {node.inputs.strength_clip !== undefined && (
          <NodeInput
            name="strength_clip"
            type="FLOAT"
            value={node.inputs.strength_clip}
            connected={false}
            onChange={(value) => onInputChange("strength_clip", value)}
          />
        )}
      </div>
    </div>
  );
}
