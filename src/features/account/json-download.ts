/* eslint-disable no-await-in-loop */
const encoder = new TextEncoder();

async function* jsonParts(value: unknown): AsyncGenerator<string> {
  if (value && typeof value === "object" && Symbol.asyncIterator in value) {
    yield "[";
    let first = true;
    for await (const item of value as AsyncIterable<unknown>) {
      if (!first) yield ",";
      first = false;
      yield* jsonParts(item);
    }
    yield "]";
    return;
  }
  if (Array.isArray(value)) {
    yield "[";
    for (let index = 0; index < value.length; index++) {
      if (index) yield ",";
      yield* jsonParts(value[index] ?? null);
    }
    yield "]";
  } else if (value && typeof value === "object" && !("toJSON" in value)) {
    yield "{";
    let first = true;
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) continue;
      if (!first) yield ",";
      first = false;
      yield `${JSON.stringify(key)}:`;
      yield* jsonParts(item);
    }
    yield "}";
  } else {
    yield value === undefined ? "null" : JSON.stringify(value);
  }
}

/** Serialize only as the consumer pulls; arrays never become one giant string. */
export const createJsonDownloadStream = (value: Record<string, unknown>) => {
  const parts = jsonParts(value);
  let pending = "";
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      let output = pending;
      pending = "";
      while (output.length < 16_384) {
        const part = await parts.next();
        if (part.done) {
          if (output) controller.enqueue(encoder.encode(output));
          controller.close();
          return;
        }
        output += part.value;
      }
      // Keep surrogate pairs intact when splitting large string values.
      let end = 16_384;
      const last = output.charCodeAt(end - 1);
      if (last >= 0xd800 && last <= 0xdbff) end--;
      pending = output.slice(end);
      controller.enqueue(encoder.encode(output.slice(0, end)));
    },
    async cancel() {
      await parts.return(undefined);
      pending = "";
    },
  });
};
