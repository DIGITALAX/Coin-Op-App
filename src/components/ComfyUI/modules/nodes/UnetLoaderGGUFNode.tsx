import { UnetLoaderGGUFNodeProps } from "../../types/comfyui.types";
import NodeInput from "../inputs/NodeInput";
import NodePorts from "../common/NodePorts";
export default function UnetLoaderGGUFNode({
  node,
  onInputChange,
  comfyUrl,
}: UnetLoaderGGUFNodeProps) {
  const width = Math.max(node.size.width, 250);
  const height = Math.max(node.size.height, 120);
  return (
    <div
      className="bg-green-600 border-2 border-green-400 rounded-lg shadow-lg relative"
      style={{
        width: width,
        minHeight: height,
      }}
    >
      <div className="bg-green-700 px-3 py-2 rounded-t-lg">
        <h3 className="font-mana text-xxxs text-white font-bold">
          {node.title}
        </h3>
        <p className="font-mana text-xxxs text-green-200 opacity-75">
          {node.class_type}
        </p>
      </div>
      <NodePorts node={node} />
      <div className="p-3 space-y-2">
        {node.inputs.unet_name && (
          <NodeInput
            name="unet_name"
            type="UNET_NAME"
            value={node.inputs.unet_name}
            connected={false}
            onChange={(value) => onInputChange("unet_name", value)}
            comfyUrl={comfyUrl}
          />
        )}
      </div>
    </div>
  );
}
