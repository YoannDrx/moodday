const encoder = new TextEncoder();

export const createJsonDownloadStream = (value: Record<string, unknown>) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      const entries = Object.entries(value);
      controller.enqueue(encoder.encode("{\n"));

      entries.forEach(([key, section], index) => {
        const separator = index === entries.length - 1 ? "\n" : ",\n";
        controller.enqueue(
          encoder.encode(
            `  ${JSON.stringify(key)}: ${JSON.stringify(section)}${separator}`,
          ),
        );
      });

      controller.enqueue(encoder.encode("}\n"));
      controller.close();
    },
  });
