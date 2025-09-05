import { VAELoaderNodeProps } from "../../types/comfyui.types";
import NodeInput from "../inputs/NodeInput";
import NodePorts from "../common/NodePorts";
export default function VAELoaderNode({
  node,
  onInputChange,
  comfyUrl,
}: VAELoaderNodeProps) {
  const width = Math.max(node.size.width, 250);
  const height = Math.max(node.size.height, 120);
  return (
    <div
      className="bg-teal-600 border-2 border-teal-400 rounded-lg shadow-lg relative"
      style={{
        width: width,
        minHeight: height,
      }}
    >
      <div className="bg-teal-700 px-3 py-2 rounded-t-lg">
        <h3 className="font-mana text-xxxs text-white font-bold">
          {node.title}
        </h3>
        <p className="font-mana text-xxxs text-teal-200 opacity-75">
          {node.class_type}
        </p>
      </div>
      <NodePorts node={node} />
      <div className="p-3 space-y-2">
        {node.inputs.vae_name && (
          <NodeInput
            name="vae_name"
            type="VAE_NAME"
            value={node.inputs.vae_name}
            connected={false}
            onChange={(value) => onInputChange("vae_name", value)}
            comfyUrl={comfyUrl}
          />
        )}
      </div>
    </div>
  );
}