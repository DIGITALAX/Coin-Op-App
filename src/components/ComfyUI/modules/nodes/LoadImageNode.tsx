import { LoadImageNodeProps } from '../../types/comfyui.types';
import NodeInput from '../inputs/NodeInput';
import NodePorts from '../common/NodePorts';
export default function LoadImageNode({ node, onInputChange }: LoadImageNodeProps) {
  const width = node.size.width;
  const height = node.size.height;
  return (
    <div
      className="bg-green-600 border-2 border-green-400 rounded-lg shadow-lg relative"
      style={{
        width: width,
        minHeight: height,
      }}
    >
      <NodePorts node={node} />
      <div className="bg-green-700 px-3 py-2 rounded-t-lg">
        <h3 className="font-mana text-xxxs text-white font-bold">
          {node.title}
        </h3>
        <p className="font-mana text-xxxs text-green-200 opacity-75">
          {node.class_type}
        </p>
      </div>
      <div className="p-3 space-y-2">
        {node.inputs.image && (
          <NodeInput
            name="image"
            type="IMAGE"
            value={node.inputs.image}
            connected={false}
            onChange={(value) => onInputChange('image', value)}
          />
        )}
      </div>
    </div>
  );
}