import { DisabledNodeProps } from "../../types/comfyui.types";
import NodePorts from "../common/NodePorts";
export default function DisabledNode({ node }: DisabledNodeProps) {
  return (
    <div
      className="bg-crema border border-crema rounded-lg shadow-lg opacity-40 relative"
      style={{
        width: node.size.width,
        height: node.size.height,
      }}
    >
      <NodePorts node={node} />
      <div className="bg-crema px-2 py-1 rounded-t-lg">
        <h3 className="font-mana text-xxxs text-crema font-bold truncate">
          {node.class_type}
        </h3>
      </div>
      <div className="p-2 flex items-center justify-center">
        <span className="text-crema font-mana text-xxxs">Unsupported</span>
      </div>
    </div>
  );
}
