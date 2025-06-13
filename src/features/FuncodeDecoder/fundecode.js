"use client";

export default () => {
  /* eslint-enable */
  return new Worker(
    `${process.env.PUBLIC_URL}/funcodeDecoder/decode_demo_v701qr20241231.js`,
    {
      type: "classic",
    }
  );
};
