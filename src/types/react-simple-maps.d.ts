declare module "react-simple-maps" {
  import type { CSSProperties, ReactNode } from "react";

  interface GeoObject {
    rsmKey: string;
    id: string | number;
    properties: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface GeographyStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    cursor?: string;
    transition?: string;
  }

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      center?: [number, number];
      scale?: number;
      rotate?: [number, number, number];
    };
    style?: CSSProperties;
    viewBox?: string;
    children?: ReactNode;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: GeoObject[] }) => ReactNode;
  }

  interface GeographyProps {
    geography: GeoObject;
    key?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
    style?: {
      default?: GeographyStyle;
      hover?: GeographyStyle;
      pressed?: GeographyStyle;
    };
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function ZoomableGroup(props: {
    center?: [number, number];
    zoom?: number;
    children?: ReactNode;
  }): JSX.Element;
}
