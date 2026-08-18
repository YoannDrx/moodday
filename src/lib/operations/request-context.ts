const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,100}$/;

export const getRequestId = (request: Request) => {
  const incoming = request.headers.get("x-request-id");
  return incoming && SAFE_REQUEST_ID.test(incoming)
    ? incoming
    : crypto.randomUUID();
};

export const getRequestLogFields = (params: {
  requestId: string;
  route: string;
  startedAt: number;
}) => ({
  requestId: params.requestId,
  route: params.route,
  durationMs: Math.max(0, Date.now() - params.startedAt),
});
