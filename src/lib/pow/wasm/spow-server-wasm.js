
import * as wasm from "./spow-server-wasm_bg.wasm";
import { __wbg_set_wasm } from "./spow-server-wasm_bg.js";
__wbg_set_wasm(wasm);
export * from "./spow-server-wasm_bg.js";
