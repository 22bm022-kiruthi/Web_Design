export interface Widget {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
  label: string; // <-- required!
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

export type Theme = 'light' | 'dark';

export interface WidgetType {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'input' | 'processing' | 'visualization';
}
