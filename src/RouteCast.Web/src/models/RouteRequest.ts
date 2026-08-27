export const TransportType = {
  Car: "Car",
  Motorcycle: "Motorcycle",
  Bike: "Bicycle",
  Walking: "Walking"
} as const;

export interface RouteRequest {
  latOrigin: number;
  longOrigin: number;
  latDestination: number;
  longDestination: number;
  date: Date;
  transport: typeof TransportType[keyof typeof TransportType];
}