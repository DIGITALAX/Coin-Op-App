import NodeInput from "../inputs/NodeInput";
import { CLIPLoaderGGUFNodeProps } from "../../types/comfyui.types";
import NodePorts from "../common/NodePorts";
export default function CLIPLoaderGGUFNode({
  node,
  onInputChange,
  comfyUrl,
}: CLIPLoaderGGUFNodeProps) {
  const width = Math.max(node.size.width, 250);
  const height = Math.max(node.size.height, 120);
  return (
    <div
      className="bg-blue-600 border-2 border-blue-400 rounded-lg shadow-lg relative"
      style={{
        width: width,
        minHeight: height,
      }}
    >
      <div className="bg-blue-700 px-3 py-2 rounded-t-lg">
        <h3 className="font-mana text-xxxs text-white font-bold">
          {node.title}
        </h3>
        <p className="font-mana text-xxxs text-blue-200 opacity-75">
          {node.class_type}
        </p>
      </div>
      <NodePorts node={node} />
      <div className="p-3 space-y-2">
        {node.inputs.clip_name && (
          <NodeInput
            name="clip_name"
            type="CLIP_NAME"
            value={node.inputs.clip_name}
            connected={false}
            onChange={(value) => onInputChange("clip_name", value)}
            comfyUrl={comfyUrl}
          />
        )}
      </div>
    </div>
  );
}
