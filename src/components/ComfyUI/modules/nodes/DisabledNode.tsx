import { DisabledNodeProps } from "../../types/comfyui.types";
import NodePorts from "../common/NodePorts";
export default function DisabledNode({ node }: DisabledNodeProps) {
  return (
    <div
      className="bg-gray-600 border border-gray-500 rounded-lg shadow-lg opacity-40 relative"
      style={{
        width: node.size.width,
        height: node.size.height,
      }}
    >
      <NodePorts node={node} />
      <div className="bg-gray-700 px-2 py-1 rounded-t-lg">
        <h3 className="font-mana text-xxxs text-gray-300 font-bold truncate">
          {node.class_type}
        </h3>
      </div>
      <div className="p-2 flex items-center justify-center">
        <span className="text-gray-400 font-mana text-xxxs">Unsupported</span>
      </div>
    </div>
  );
}
