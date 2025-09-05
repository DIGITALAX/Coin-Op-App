import { useGenericNode } from "../../hooks/useGenericNode";
import { GenericNodeProps } from "../../types/comfyui.types";
import NodeInput from "../inputs/NodeInput";
export default function GenericNode({ node, onInputChange }: GenericNodeProps) {
  const {
    width,
    height,
    nonConnectedInputs,
    connectedInputs,
    inputEntries,
  } = useGenericNode(node);
  return (
    <div
      className="bg-gray-600 border-2 border-gray-400 rounded-lg shadow-lg relative"
      style={{
        width: width,
        minHeight: height,
      }}
    >
      <div className="bg-gray-700 px-3 py-2 rounded-t-lg">
        <h3 className="font-mana text-xxxs text-white font-bold">
          {node.title}
        </h3>
        <p className="font-mana text-xxxs text-gray-200 opacity-75">
          {node.class_type}
        </p>
      </div>
      <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
        {nonConnectedInputs.map(([inputName, value]) => (
          <NodeInput
            key={inputName}
            name={inputName}
            type={node.nodeInfo.input_types[inputName] || "TEXT"}
            value={value}
            connected={false}
            onChange={(newValue) => onInputChange(inputName, newValue)}
          />
        ))}
        {connectedInputs.map(([inputName, _]) => (
          <div
            key={inputName}
            className="flex items-center justify-between py-1"
          >
            <span className="text-white font-mana text-xxxs">{inputName}:</span>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        ))}
      </div>
      <div className="absolute right-0 top-8 transform translate-x-1/2 space-y-3">
        {node.outputs.map((outputType, index) => (
          <div key={`output-${index}`}>
            <div className="w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
            <span className="absolute right-4 top-0 text-xxxs text-white font-mana whitespace-nowrap">
              {outputType}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute left-0 top-8 transform -translate-x-1/2 space-y-2">
        {inputEntries.map(([inputName, _]) => (
          <div key={inputName} className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            <span className="absolute left-4 text-xxxs text-white font-mana whitespace-nowrap">
              {inputName.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
