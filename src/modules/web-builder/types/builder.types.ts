export interface Website {
  id: string;
  name: string;
  domain?: string;
  status: 'draft' | 'published' | 'archived';
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  sections: PageSection[];
}

export interface PageSection {
  id: string;
  type: string;
  order: number;
  elements: PageElement[];
  settings: Record<string, any>;
}

export interface PageElement {
  id: string;
  type: string;
  content: any;
  settings: Record<string, any>;
}

export type DragItem = {
  id: string;
  type: string;
  data?: any;
};
