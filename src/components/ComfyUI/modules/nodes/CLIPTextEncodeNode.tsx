import { CLIPTextEncodeNodeProps } from "../../types/comfyui.types";
import NodeInput from "../inputs/NodeInput";
import NodePorts from "../common/NodePorts";
export default function CLIPTextEncodeNode({
  node,
  onInputChange,
}: CLIPTextEncodeNodeProps) {
  const width = Math.max(node.size.width, 600);
  const height = Math.max(node.size.height, 400);
  return (
    <div
      className="bg-blue-600 border-2 border-blue-400 rounded-lg shadow-lg relative"
      style={{
        width: width,
        minHeight: height,
      }}
    >
      <NodePorts node={node} />
      <div className="bg-blue-700 px-3 py-2 rounded-t-lg">
        <h3 className="font-mana text-xxxs text-white font-bold">
          {node.title}
        </h3>
        <p className="font-mana text-xxxs text-blue-200 opacity-75">
          {node.class_type}
        </p>
      </div>
      <div className="p-3 space-y-2 mt-8">
        {node.inputs.text && !Array.isArray(node.inputs.text) && (
          <NodeInput
            name="text"
            type="TEXT"
            value={node.inputs.text}
            connected={false}
            onChange={(value) => onInputChange("text", value)}
          />
        )}
      </div>
    </div>
  );
}
