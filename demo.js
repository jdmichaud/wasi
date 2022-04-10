const fs = require('fs');

async function tryInstanciate(source, imports) {
  try {
    return await WebAssembly.instantiate(source, imports);
  } catch (error) {
    const errorStr = error.toString();
    const moduleName = new RegExp('module="([^"]*)"').exec(errorStr.toString())[1];
    const functionName = new RegExp('function="([^"]*)"').exec(errorStr.toString())[1];
    console.log(`patching ${moduleName}/${functionName}`);
    imports[moduleName][functionName] = () => {
      throw new Error(`${moduleName}/${functionName}: Not implemented`);
    }
    return tryInstanciate(source, imports);
  }
}

async function main() {
  const data = fs.readFileSync('./demo.wasm');
  const source = new Uint8Array(data);
  const imports = {
    wasi_snapshot_preview1: {
      environ_sizes_get: () => {
        ret
      }
    },
  };
  const { wasmModule, instance } = await tryInstanciate(source, imports);
  global.wasmModule = wasmModule;
  global.instance = instance;

  instance.exports.main();
}

main()
