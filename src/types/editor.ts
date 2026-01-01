// Core type definitions for the UI design editor

export type ElementType =
  | "frame"
  | "rectangle"
  | "ellipse"
  | "text"
  | "image"
  | "group"
  | "star"
  | "line";

export type TextAlign = "left" | "center" | "right" | "justify";

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  scaleX?: number;
  scaleY?: number;
}

export interface Fill {
  type: "solid" | "gradient";
  color: string;
  gradient?: {
    type: "linear" | "radial";
    stops: Array<{ offset: number; color: string }>;
    angle?: number;
  };
}

export interface Stroke {
  color: string;
  width: number;
}

export interface Shadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: TextAlign;
  textDecoration?: "underline" | "line-through" | "none";
}

export interface ImageStyle {
  src?: string;
  fit: "contain" | "cover" | "fill" | "none";
}

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  visible: boolean;
  locked: boolean;
  transform: Transform;
  fill: Fill;
  stroke?: Stroke;
  borderRadius: number;
  shadow?: Shadow;
  parentId?: string;
}

export interface FrameElement extends BaseElement {
  type: "frame";
  preset?: "mobile" | "tablet" | "desktop" | "custom";
}

export interface RectangleElement extends BaseElement {
  type: "rectangle";
}

export interface EllipseElement extends BaseElement {
  type: "ellipse";
}

export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  style: TextStyle;
}

export interface ImageElement extends BaseElement {
  type: "image";
  imageStyle: ImageStyle;
}

export interface GroupElement extends BaseElement {
  type: "group";
  children: string[];
}

export interface StarElement extends BaseElement {
  type: "star";
}

export interface LineElement extends BaseElement {
  type: "line";
}

export type Element =
  | FrameElement
  | RectangleElement
  | EllipseElement
  | TextElement
  | ImageElement
  | GroupElement
  | StarElement
  | LineElement;

export interface Page {
  id: string;
  name: string;
  elements: Element[];
  background?: string;
}

export interface Project {
  id: string;
  name: string;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
}

export interface EditorState {
  project: Project | null;
  currentPageId: string | null;
  selectedElementIds: string[];
  tool:
    | "select"
    | "frame"
    | "rectangle"
    | "ellipse"
    | "text"
    | "image"
    | "hand"
    | "star"
    | "line";
  zoom: number;
  pan: Position;
  gridVisible: boolean;
  rulersVisible: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
}

// Command Pattern Types
export type Command =
  | {
      type: "UPDATE_ELEMENT";
      id: string;
      before: Partial<Element>;
      after: Partial<Element>;
    }
  | { type: "ADD_ELEMENT"; element: Element }
  | { type: "DELETE_ELEMENT"; element: Element }
  | {
      type: "MOVE_ELEMENT";
      id: string;
      fromParent: string | undefined;
      toParent: string | undefined;
    }
  | {
      type: "REORDER_ELEMENT";
      elementId: string;
      oldIndex: number;
      newIndex: number;
    };
