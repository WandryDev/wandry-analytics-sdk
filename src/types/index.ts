export type EventType = "installed";
export type EventRequest<
  T extends Omit<Request, "duplex"> = Omit<Request, "duplex">
> = T;
