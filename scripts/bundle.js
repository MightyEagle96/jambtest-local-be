import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["dist/app.js"], // your main compiled JS
    outfile: "bundle.js",
    bundle: true,
    platform: "node",
    target: "node18",
    minify: true,
    sourcemap: false,
    external: [], // add native modules if necessary
  })
  .then(() => {
    console.log("Bundling completed ✔");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
