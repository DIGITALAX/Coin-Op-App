export interface TemplateChoice {
  name: string;
  type: "hoodie" | "shirt" | "poster" | "sticker";
  image: string;
}

export interface GroupedTemplate {
  name: string;
  template_type: string;
  image: string;
  templates: Template[];
}

export interface Template {
  price: string;
  childType: string;
  templateContract: string;
  templateId: string;
  currency: string;
  childReferences: Child[];
  metadata: {
    title: string;
    image: string;
    tags: string[];
    ratio: number;
  };
  uri: string;
  templateChoice?: TemplateChoice;
}

export interface Child {
  uri: string;
  price: string;
  childId: string;
  metadata: {
    ratio: number;
    instructions?: string;
    seamAllowance: string;
    location: string;
    scale: number;
    flip: number;
    rotation: number;
    x: number;
    y: number;
  };
  amount: number;
  childContract: string;
  child: {
    uri: string;
    metadata: {
      tags: string[];
      image: string;
      title: string;
    };
  };
}
