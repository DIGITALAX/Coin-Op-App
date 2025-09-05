import CLIPTextEncodeNode from "./nodes/CLIPTextEncodeNode";
import KSamplerNode from "./nodes/KSamplerNode";
import LoadImageNode from "./nodes/LoadImageNode";
import LoraLoaderNode from "./nodes/LoraLoaderNode";
import VAELoaderNode from "./nodes/VAELoaderNode";
import UnetLoaderGGUFNode from "./nodes/UnetLoaderGGUFNode";
import CLIPLoaderGGUFNode from "./nodes/CLIPLoaderGGUFNode";
import DisabledNode from "./nodes/DisabledNode";
import { NodeFactoryProps } from "../types/comfyui.types";
import { SUPPORTED_NODES } from "../../../lib/constants";
export default function NodeFactory({ node, onInputChange, comfyUrl }: NodeFactoryProps) {
  const handleInputChange = (inputName: string, value: any) => {
    onInputChange(node.id, inputName, value);
  };
  if (!SUPPORTED_NODES.includes(node.class_type)) {
    return <DisabledNode node={node} />;
  }
  switch (node.class_type) {
    case "CLIPTextEncode":
      return (
        <CLIPTextEncodeNode node={node} onInputChange={handleInputChange} />
      );
    case "KSampler":
      return <KSamplerNode node={node} onInputChange={handleInputChange} />;
    case "LoadImage":
      return <LoadImageNode node={node} onInputChange={handleInputChange} />;
    case "LoraLoader":
      return <LoraLoaderNode node={node} onInputChange={handleInputChange} comfyUrl={comfyUrl} />;
    case "VAELoader":
      return <VAELoaderNode node={node} onInputChange={handleInputChange} comfyUrl={comfyUrl} />;
    case "UnetLoaderGGUF":
      return (
        <UnetLoaderGGUFNode node={node} onInputChange={handleInputChange} comfyUrl={comfyUrl} />
      );
    case "CLIPLoaderGGUF":
      return (
        <CLIPLoaderGGUFNode node={node} onInputChange={handleInputChange} comfyUrl={comfyUrl} />
      );
    default:
      return <DisabledNode node={node} />;
  }
}
