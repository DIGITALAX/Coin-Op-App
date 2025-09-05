import { NodePortsProps } from "../../types/comfyui.types";

export default function NodePorts({ node }: NodePortsProps) {
  const getPortColor = (type: string) => {
    switch (type) {
      case "MODEL":
        return "bg-blue-500";
      case "CLIP":
        return "bg-yellow-500";
      case "VAE":
        return "bg-teal-500";
      case "LATENT":
        return "bg-pink-500";
      case "CONDITIONING":
        return "bg-green-500";
      case "IMAGE":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };
  return (
    <>
      {node.inputPorts.map((port) => (
        <div
          key={port.id}
          className="absolute"
          style={{
            left: port.position.x,
            top: port.position.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className={`w-3 h-3 rounded-full border-2 border-white ${getPortColor(
              port.type
            )}`}
          ></div>
          <span className="absolute right-4 top-0 text-xxxs text-white font-mana whitespace-nowrap transform -translate-y-1/2">
            {port.name}
          </span>
        </div>
      ))}
      {node.outputPorts.map((port) => (
        <div
          key={port.id}
          className="absolute"
          style={{
            left: port.position.x,
            top: port.position.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className={`w-3 h-3 rounded-full border-2 border-white ${getPortColor(
              port.type
            )}`}
          ></div>
          <span className="absolute left-4 top-0 text-xxxs text-white font-mana whitespace-nowrap transform -translate-y-1/2">
            {port.name}
          </span>
        </div>
      ))}
    </>
  );
}
