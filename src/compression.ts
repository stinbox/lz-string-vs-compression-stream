const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const createUpstream = (value: unknown) => {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(value);
      controller.close();
    },
  });
};

export async function compressToBase64(input: string): Promise<string> {
  const upstream = createUpstream(textEncoder.encode(input));
  const compression = new CompressionStream("deflate");
  upstream.pipeThrough(compression);
  const compressed = await new Response(compression.readable).arrayBuffer();
  return btoa(
    new Uint8Array(compressed).reduce(
      (acc, c) => acc + String.fromCharCode(c),
      "",
    ),
  );
}

export async function decompressFromBase64(input: string): Promise<string> {
  const compressedBytes = Uint8Array.from(atob(input), (c) => c.charCodeAt(0));
  const upstream = createUpstream(compressedBytes);
  const decompression = new DecompressionStream("deflate");
  upstream.pipeThrough(decompression);
  const decompressed = await new Response(decompression.readable).arrayBuffer();
  return textDecoder.decode(decompressed);
}

export async function compressToUTF16(input: string): Promise<string> {
  const upstream = createUpstream(textEncoder.encode(input));
  const compression = new CompressionStream("deflate");
  upstream.pipeThrough(compression);
  const compressed = await new Response(compression.readable).arrayBuffer();
  const compressedBytes = new Uint16Array(compressed);
  return String.fromCharCode(...compressedBytes);
}

export async function decompressFromUTF16(input: string): Promise<string> {
  const compressedUint16Array = new Uint16Array(
    input.split("").map((c) => c.charCodeAt(0)),
  );
  const compressedBytes = new Uint8Array(compressedUint16Array.buffer);

  const upstream = createUpstream(compressedBytes);
  const decompression = new DecompressionStream("deflate");
  upstream.pipeThrough(decompression);
  const decompressed = await new Response(decompression.readable).arrayBuffer();
  return textDecoder.decode(decompressed);
}

export async function compressToUint8Array(input: string): Promise<Uint8Array> {
  const upstream = createUpstream(textEncoder.encode(input));
  const compression = new CompressionStream("deflate");
  upstream.pipeThrough(compression);
  const compressed = await new Response(compression.readable).arrayBuffer();
  return new Uint8Array(compressed);
}

export async function decompressFromUint8Array(
  input: Uint8Array,
): Promise<string> {
  const upstream = createUpstream(input);
  const decompression = new DecompressionStream("deflate");
  upstream.pipeThrough(decompression);
  const decompressed = await new Response(decompression.readable).arrayBuffer();
  return textDecoder.decode(decompressed);
}

export async function compressToEncodedURIComponent(
  input: string,
): Promise<string> {
  const withBase64 = await compressToBase64(input);
  return withBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function decompressFromEncodedURIComponent(
  input: string,
): Promise<string> {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return decompressFromBase64(base64);
}
