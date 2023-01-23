
var Module = typeof Module != "undefined" ? Module : {};
if (typeof Object.assign == "undefined") {
  Object.assign = function(target, source) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      if (!source) {
        continue;
      }
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
}
if (!Module.expectedDataFileDownloads) {
  Module.expectedDataFileDownloads = 0;
}
Module.expectedDataFileDownloads++;
(function() {
  if (Module["ENVIRONMENT_IS_PTHREAD"]) {
    return;
  }
  var loadPackage = function(metadata) {
    var PACKAGE_PATH = "";
    if (typeof window === "object") {
      PACKAGE_PATH = window["encodeURIComponent"](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf("/")) + "/");
    } else if (typeof process === "undefined" && typeof location !== "undefined") {
      PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf("/")) + "/");
    }
    var PACKAGE_NAME = "cc.data";
    var REMOTE_PACKAGE_BASE = "cc.data";
    if (typeof Module["locateFilePackage"] === "function" && !Module["locateFile"]) {
      Module["locateFile"] = Module["locateFilePackage"];
      err("warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)");
    }
    var REMOTE_PACKAGE_NAME = Module["locateFile"] ? Module["locateFile"](REMOTE_PACKAGE_BASE, "") : REMOTE_PACKAGE_BASE;
    var REMOTE_PACKAGE_SIZE = metadata["remote_package_size"];
    function fetchRemotePackage(packageName, packageSize, callback, errback) {
      if (typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string") {
        require("fs").readFile(packageName, function(err, contents) {
          if (err) {
            errback(err);
          } else {
            callback(contents.buffer);
          }
        });
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", packageName, true);
      xhr.responseType = "arraybuffer";
      xhr.onprogress = function(event) {
        var url = packageName;
        var size = packageSize;
        if (event.total) {
          size = event.total;
        }
        if (event.loaded) {
          if (!xhr.addedTotal) {
            xhr.addedTotal = true;
            if (!Module.dataFileDownloads) {
              Module.dataFileDownloads = {};
            }
            Module.dataFileDownloads[url] = {loaded:event.loaded, total:size};
          } else {
            Module.dataFileDownloads[url].loaded = event.loaded;
          }
          var total = 0;
          var loaded = 0;
          var num = 0;
          for (var download in Module.dataFileDownloads) {
            var data = Module.dataFileDownloads[download];
            total += data.total;
            loaded += data.loaded;
            num++;
          }
          total = Math.ceil(total * Module.expectedDataFileDownloads / num);
          if (Module["setStatus"]) {
            Module["setStatus"]("Downloading data... (" + loaded + "/" + total + ")");
          }
        } else if (!Module.dataFileDownloads) {
          if (Module["setStatus"]) {
            Module["setStatus"]("Downloading data...");
          }
        }
      };
      xhr.onerror = function(event) {
        throw new Error("NetworkError for: " + packageName);
      };
      xhr.onload = function(event) {
        if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || xhr.status == 0 && xhr.response) {
          var packageData = xhr.response;
          callback(packageData);
        } else {
          throw new Error(xhr.statusText + " : " + xhr.responseURL);
        }
      };
      xhr.send(null);
    }
    function handleError(error) {
      console.error("package error:", error);
    }
    var fetchedCallback = null;
    var fetched = Module["getPreloadedPackage"] ? Module["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;
    if (!fetched) {
      fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
        if (fetchedCallback) {
          fetchedCallback(data);
          fetchedCallback = null;
        } else {
          fetched = data;
        }
      }, handleError);
    }
    function runWithFS() {
      function assert(check, msg) {
        if (!check) {
          throw msg + (new Error()).stack;
        }
      }
      Module["FS_createPath"]("/", "texpacks", true, true);
      function DataRequest(start, end, audio) {
        this.start = start;
        this.end = end;
        this.audio = audio;
      }
      DataRequest.prototype = {requests:{}, open:function(mode, name) {
        this.name = name;
        this.requests[name] = this;
        Module["addRunDependency"]("fp " + this.name);
      }, send:function() {
      }, onload:function() {
        var byteArray = this.byteArray.subarray(this.start, this.end);
        this.finish(byteArray);
      }, finish:function(byteArray) {
        var that = this;
        Module["FS_createDataFile"](this.name, null, byteArray, true, true, true);
        Module["removeRunDependency"]("fp " + that.name);
        this.requests[this.name] = null;
      }};
      var files = metadata["files"];
      for (var i = 0; i < files.length; ++i) {
        (new DataRequest(files[i]["start"], files[i]["end"], files[i]["audio"] || 0)).open("GET", files[i]["filename"]);
      }
      function processPackageData(arrayBuffer) {
        assert(arrayBuffer, "Loading data file failed.");
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, "bad input to processPackageData");
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        DataRequest.prototype.byteArray = byteArray;
        var files = metadata["files"];
        for (var i = 0; i < files.length; ++i) {
          DataRequest.prototype.requests[files[i].filename].onload();
        }
        Module["removeRunDependency"]("datafile_cc.data");
      }
      Module["addRunDependency"]("datafile_cc.data");
      if (!Module.preloadResults) {
        Module.preloadResults = {};
      }
      Module.preloadResults[PACKAGE_NAME] = {fromCache:false};
      if (fetched) {
        processPackageData(fetched);
        fetched = null;
      } else {
        fetchedCallback = processPackageData;
      }
    }
    if (Module["calledRun"]) {
      runWithFS();
    } else {
      if (!Module["preRun"]) {
        Module["preRun"] = [];
      }
      Module["preRun"].push(runWithFS);
    }
  };
  loadPackage({"files":[{"filename":"/texpacks/default.zip", "start":0, "end":72496}], "remote_package_size":72496});
})();
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = function(status, toThrow) {
  throw toThrow;
};
var ENVIRONMENT_IS_WEB = typeof window == "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
var scriptDirectory = "";
function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}
var read_, readAsync, readBinary, setWindowTitle;
function logExceptionOnExit(e) {
  if (e instanceof ExitStatus) {
    return;
  }
  var toLog = e;
  err("exiting due to exception: " + toLog);
}
if (ENVIRONMENT_IS_NODE) {
  var fs = require("fs");
  var nodePath = require("path");
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = nodePath.dirname(scriptDirectory) + "/";
  } else {
    scriptDirectory = __dirname + "/";
  }
  read_ = function(filename, binary) {
    filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
    return fs.readFileSync(filename, binary ? undefined : "utf8");
  };
  readBinary = function(filename) {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    return ret;
  };
  readAsync = function(filename, onload, onerror) {
    filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
    fs.readFile(filename, function(err, data) {
      if (err) {
        onerror(err);
      } else {
        onload(data.buffer);
      }
    });
  };
  if (process["argv"].length > 1) {
    thisProgram = process["argv"][1].replace(/\\/g, "/");
  }
  arguments_ = process["argv"].slice(2);
  if (typeof module != "undefined") {
    module["exports"] = Module;
  }
  process["on"]("uncaughtException", function(ex) {
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  process["on"]("unhandledRejection", function(reason) {
    throw reason;
  });
  quit_ = function(status, toThrow) {
    if (keepRuntimeAlive()) {
      process["exitCode"] = status;
      throw toThrow;
    }
    logExceptionOnExit(toThrow);
    process["exit"](status);
  };
  Module["inspect"] = function() {
    return "[Emscripten Module object]";
  };
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href;
  } else if (typeof document != "undefined" && document.currentScript) {
    scriptDirectory = document.currentScript.src;
  }
  if (scriptDirectory.indexOf("blob:") !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
  } else {
    scriptDirectory = "";
  }
  {
    read_ = function(url) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      return xhr.responseText;
    };
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = function(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(xhr.response);
      };
    }
    readAsync = function(url, onload, onerror) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = function() {
        if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
          onload(xhr.response);
          return;
        }
        onerror();
      };
      xhr.onerror = onerror;
      xhr.send(null);
    };
  }
  setWindowTitle = function(title) {
    return document.title = title;
  };
} else {
}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
if (Module["arguments"]) {
  arguments_ = Module["arguments"];
}
if (Module["thisProgram"]) {
  thisProgram = Module["thisProgram"];
}
if (Module["quit"]) {
  quit_ = Module["quit"];
}
var STACK_ALIGN = 16;
var POINTER_SIZE = 4;
function getNativeTypeSize(type) {
  switch(type) {
    case "i1":
    case "i8":
    case "u8":
      return 1;
    case "i16":
    case "u16":
      return 2;
    case "i32":
    case "u32":
      return 4;
    case "i64":
    case "u64":
      return 8;
    case "float":
      return 4;
    case "double":
      return 8;
    default:
      {
        if (type[type.length - 1] === "*") {
          return POINTER_SIZE;
        }
        if (type[0] === "i") {
          var bits = Number(type.substr(1));
          assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
          return bits / 8;
        }
        return 0;
      }
  }
}
var wasmBinary;
if (Module["wasmBinary"]) {
  wasmBinary = Module["wasmBinary"];
}
var noExitRuntime = Module["noExitRuntime"] || true;
if (typeof WebAssembly != "object") {
  abort("no native wasm support detected");
}
var wasmMemory;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
  if (!condition) {
    abort(text);
  }
}
var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) {
    ++endPtr;
  }
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode((u0 & 31) << 6 | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = (u0 & 15) << 12 | u1 << 6 | u2;
    } else {
      u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
    }
  }
  return str;
}
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) {
    return 0;
  }
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = 65536 + ((u & 1023) << 10) | u1 & 1023;
    }
    if (u <= 127) {
      if (outIdx >= endIdx) {
        break;
      }
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) {
        break;
      }
      heap[outIdx++] = 192 | u >> 6;
      heap[outIdx++] = 128 | u & 63;
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) {
        break;
      }
      heap[outIdx++] = 224 | u >> 12;
      heap[outIdx++] = 128 | u >> 6 & 63;
      heap[outIdx++] = 128 | u & 63;
    } else {
      if (outIdx + 3 >= endIdx) {
        break;
      }
      heap[outIdx++] = 240 | u >> 18;
      heap[outIdx++] = 128 | u >> 12 & 63;
      heap[outIdx++] = 128 | u >> 6 & 63;
      heap[outIdx++] = 128 | u & 63;
    }
  }
  heap[outIdx] = 0;
  return outIdx - startIdx;
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
}
var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module["HEAP8"] = HEAP8 = new Int8Array(buf);
  Module["HEAP16"] = HEAP16 = new Int16Array(buf);
  Module["HEAP32"] = HEAP32 = new Int32Array(buf);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}
var STACK_SIZE = 65536;
var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
function keepRuntimeAlive() {
  return noExitRuntime;
}
function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") {
      Module["preRun"] = [Module["preRun"]];
    }
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
  runtimeInitialized = true;
  if (!Module["noFSInit"] && !FS.init.initialized) {
    FS.init();
  }
  FS.ignorePermissions = false;
  TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function postRun() {
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") {
      Module["postRun"] = [Module["postRun"]];
    }
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
function addOnExit(cb) {
}
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
if (!Math.imul || Math.imul(4294967295, 5) !== -5) {
  Math.imul = function imul(a, b) {
    var ah = a >>> 16;
    var al = a & 65535;
    var bh = b >>> 16;
    var bl = b & 65535;
    return al * bl + (ah * bl + al * bh << 16) | 0;
  };
}
if (!Math.fround) {
  var froundBuffer = new Float32Array(1);
  Math.fround = function(x) {
    froundBuffer[0] = x;
    return froundBuffer[0];
  };
}
if (!Math.clz32) {
  Math.clz32 = function(x) {
    var n = 32;
    var y = x >> 16;
    if (y) {
      n -= 16;
      x = y;
    }
    y = x >> 8;
    if (y) {
      n -= 8;
      x = y;
    }
    y = x >> 4;
    if (y) {
      n -= 4;
      x = y;
    }
    y = x >> 2;
    if (y) {
      n -= 2;
      x = y;
    }
    y = x >> 1;
    if (y) {
      return n - 2;
    }
    return n - x;
  };
}
if (!Math.trunc) {
  Math.trunc = function(x) {
    return x < 0 ? Math.ceil(x) : Math.floor(x);
  };
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
  return id;
}
function addRunDependency(id) {
  runDependencies++;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
}
function removeRunDependency(id) {
  runDependencies--;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}
function abort(what) {
  if (Module["onAbort"]) {
    Module["onAbort"](what);
  }
  what = "Aborted(" + what + ")";
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  what += ". Build with -sASSERTIONS for more info.";
  var e = new WebAssembly.RuntimeError(what);
  throw e;
}
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
  return filename.startsWith(dataURIPrefix);
}
function isFileURI(filename) {
  return filename.startsWith("file://");
}
var wasmBinaryFile;
wasmBinaryFile = "cc.wasm";
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}
function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  } catch (err$0) {
    abort(err$0);
  }
}
function getBinaryPromise() {
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch == "function" && !isFileURI(wasmBinaryFile)) {
      return fetch(wasmBinaryFile, {credentials:"same-origin"}).then(function(response) {
        if (!response["ok"]) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response["arrayBuffer"]();
      }).catch(function() {
        return getBinary(wasmBinaryFile);
      });
    } else {
      if (readAsync) {
        return new Promise(function(resolve, reject) {
          readAsync(wasmBinaryFile, function(response) {
            resolve(new Uint8Array(response));
          }, reject);
        });
      }
    }
  }
  return Promise.resolve().then(function() {
    return getBinary(wasmBinaryFile);
  });
}
function createWasm() {
  var info = {"env":asmLibraryArg, "wasi_snapshot_preview1":asmLibraryArg,};
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module["asm"] = exports;
    wasmMemory = Module["asm"]["memory"];
    updateGlobalBufferAndViews(wasmMemory.buffer);
    wasmTable = Module["asm"]["__indirect_function_table"];
    addOnInit(Module["asm"]["__wasm_call_ctors"]);
    removeRunDependency("wasm-instantiate");
  }
  addRunDependency("wasm-instantiate");
  function receiveInstantiationResult(result) {
    receiveInstance(result["instance"]);
  }
  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(function(instance) {
      return instance;
    }).then(receiver, function(reason) {
      err("failed to asynchronously prepare wasm: " + reason);
      abort(reason);
    });
  }
  function instantiateAsync() {
    if (!wasmBinary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
      return fetch(wasmBinaryFile, {credentials:"same-origin"}).then(function(response) {
        var result = WebAssembly.instantiateStreaming(response, info);
        return result.then(receiveInstantiationResult, function(reason) {
          err("wasm streaming compile failed: " + reason);
          err("falling back to ArrayBuffer instantiation");
          return instantiateArrayBuffer(receiveInstantiationResult);
        });
      });
    } else {
      return instantiateArrayBuffer(receiveInstantiationResult);
    }
  }
  if (Module["instantiateWasm"]) {
    try {
      var exports = Module["instantiateWasm"](info, receiveInstance);
      return exports;
    } catch (e) {
      err("Module.instantiateWasm callback failed with error: " + e);
      return false;
    }
  }
  instantiateAsync();
  return {};
}
var tempDouble;
var tempI64;
var ASM_CONSTS = {};
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}
function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    callbacks.shift()(Module);
  }
}
function getValue(ptr, type) {
  type = type === void 0 ? "i8" : type;
  if (type.endsWith("*")) {
    type = "*";
  }
  switch(type) {
    case "i1":
      return HEAP8[ptr >> 0];
    case "i8":
      return HEAP8[ptr >> 0];
    case "i16":
      return HEAP16[ptr >> 1];
    case "i32":
      return HEAP32[ptr >> 2];
    case "i64":
      return HEAP32[ptr >> 2];
    case "float":
      return HEAPF32[ptr >> 2];
    case "double":
      return HEAPF64[ptr >> 3];
    case "*":
      return HEAPU32[ptr >> 2];
    default:
      abort("invalid type for getValue: " + type);
  }
  return null;
}
function setValue(ptr, value, type) {
  type = type === void 0 ? "i8" : type;
  if (type.endsWith("*")) {
    type = "*";
  }
  switch(type) {
    case "i1":
      HEAP8[ptr >> 0] = value;
      break;
    case "i8":
      HEAP8[ptr >> 0] = value;
      break;
    case "i16":
      HEAP16[ptr >> 1] = value;
      break;
    case "i32":
      HEAP32[ptr >> 2] = value;
      break;
    case "i64":
      tempI64 = [value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1.0 ? tempDouble > 0.0 ? (Math.min(+Math.floor(tempDouble / 4294967296.0), 4294967295.0) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296.0) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
      break;
    case "float":
      HEAPF32[ptr >> 2] = value;
      break;
    case "double":
      HEAPF64[ptr >> 3] = value;
      break;
    case "*":
      HEAPU32[ptr >> 2] = value;
      break;
    default:
      abort("invalid type for setValue: " + type);
  }
}
function _emscripten_set_main_loop_timing(mode, value) {
  Browser.mainLoop.timingMode = mode;
  Browser.mainLoop.timingValue = value;
  if (!Browser.mainLoop.func) {
    return 1;
  }
  if (!Browser.mainLoop.running) {
    Browser.mainLoop.running = true;
  }
  if (mode == 0) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
      var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
      setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
    };
    Browser.mainLoop.method = "timeout";
  } else if (mode == 1) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
      Browser.requestAnimationFrame(Browser.mainLoop.runner);
    };
    Browser.mainLoop.method = "rAF";
  } else if (mode == 2) {
    if (typeof setImmediate == "undefined") {
      var setImmediates = [];
      var emscriptenMainLoopMessageId = "setimmediate";
      var Browser_setImmediate_messageHandler = function(event) {
        if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
          event.stopPropagation();
          setImmediates.shift()();
        }
      };
      addEventListener("message", Browser_setImmediate_messageHandler, true);
      setImmediate = function Browser_emulated_setImmediate(func) {
        setImmediates.push(func);
        if (ENVIRONMENT_IS_WORKER) {
          if (Module["setImmediates"] === undefined) {
            Module["setImmediates"] = [];
          }
          Module["setImmediates"].push(func);
          postMessage({target:emscriptenMainLoopMessageId});
        } else {
          postMessage(emscriptenMainLoopMessageId, "*");
        }
      };
    }
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
      setImmediate(Browser.mainLoop.runner);
    };
    Browser.mainLoop.method = "immediate";
  }
  return 0;
}
var _emscripten_get_now;
if (ENVIRONMENT_IS_NODE) {
  _emscripten_get_now = function() {
    var t = process["hrtime"]();
    return t[0] * 1e3 + t[1] / 1e6;
  };
} else if (typeof performance != "undefined" && performance.now) {
  _emscripten_get_now = function() {
    return performance.now();
  };
} else {
  _emscripten_get_now = Date.now;
}
var PATH = {isAbs:function(path) {
  return path.charAt(0) === "/";
}, splitPath:function(filename) {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
}, normalizeArray:function(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === ".") {
      parts.splice(i, 1);
    } else if (last === "..") {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }
  if (allowAboveRoot) {
    for (; up; up--) {
      parts.unshift("..");
    }
  }
  return parts;
}, normalize:function(path) {
  var isAbsolute = PATH.isAbs(path), trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter(function(p) {
    return !!p;
  }), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
    path = ".";
  }
  if (path && trailingSlash) {
    path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
}, dirname:function(path) {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
    return ".";
  }
  if (dir) {
    dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
}, basename:function(path) {
  if (path === "/") {
    return "/";
  }
  path = PATH.normalize(path);
  path = path.replace(/\/$/, "");
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) {
    return path;
  }
  return path.substr(lastSlash + 1);
}, join:function() {
  var paths = Array.prototype.slice.call(arguments);
  return PATH.normalize(paths.join("/"));
}, join2:function(l, r) {
  return PATH.normalize(l + "/" + r);
}};
function getRandomDevice() {
  if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
    var randomBuffer = new Uint8Array(1);
    return function() {
      crypto.getRandomValues(randomBuffer);
      return randomBuffer[0];
    };
  } else if (ENVIRONMENT_IS_NODE) {
    try {
      var crypto_module = require("crypto");
      return function() {
        return crypto_module["randomBytes"](1)[0];
      };
    } catch (e) {
    }
  }
  return function() {
    return abort("randomDevice");
  };
}
var PATH_FS = {resolve:function() {
  var resolvedPath = "", resolvedAbsolute = false;
  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = i >= 0 ? arguments[i] : FS.cwd();
    if (typeof path != "string") {
      throw new TypeError("Arguments to path.resolve must be strings");
    } else if (!path) {
      return "";
    }
    resolvedPath = path + "/" + resolvedPath;
    resolvedAbsolute = PATH.isAbs(path);
  }
  resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
    return !!p;
  }), !resolvedAbsolute).join("/");
  return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
}, relative:function(from, to) {
  from = PATH_FS.resolve(from).substr(1);
  to = PATH_FS.resolve(to).substr(1);
  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== "") {
        break;
      }
    }
    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== "") {
        break;
      }
    }
    if (start > end) {
      return [];
    }
    return arr.slice(start, end - start + 1);
  }
  var fromParts = trim(from.split("/"));
  var toParts = trim(to.split("/"));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }
  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push("..");
  }
  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join("/");
}};
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) {
    u8array.length = numBytesWritten;
  }
  return u8array;
}
var TTY = {ttys:[], init:function() {
}, shutdown:function() {
}, register:function(dev, ops) {
  TTY.ttys[dev] = {input:[], output:[], ops:ops};
  FS.registerDevice(dev, TTY.stream_ops);
}, stream_ops:{open:function(stream) {
  var tty = TTY.ttys[stream.node.rdev];
  if (!tty) {
    throw new FS.ErrnoError(43);
  }
  stream.tty = tty;
  stream.seekable = false;
}, close:function(stream) {
  stream.tty.ops.fsync(stream.tty);
}, fsync:function(stream) {
  stream.tty.ops.fsync(stream.tty);
}, read:function(stream, buffer, offset, length, pos) {
  if (!stream.tty || !stream.tty.ops.get_char) {
    throw new FS.ErrnoError(60);
  }
  var bytesRead = 0;
  for (var i = 0; i < length; i++) {
    var result;
    try {
      result = stream.tty.ops.get_char(stream.tty);
    } catch (e) {
      throw new FS.ErrnoError(29);
    }
    if (result === undefined && bytesRead === 0) {
      throw new FS.ErrnoError(6);
    }
    if (result === null || result === undefined) {
      break;
    }
    bytesRead++;
    buffer[offset + i] = result;
  }
  if (bytesRead) {
    stream.node.timestamp = Date.now();
  }
  return bytesRead;
}, write:function(stream, buffer, offset, length, pos) {
  if (!stream.tty || !stream.tty.ops.put_char) {
    throw new FS.ErrnoError(60);
  }
  try {
    for (var i = 0; i < length; i++) {
      stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
    }
  } catch (e) {
    throw new FS.ErrnoError(29);
  }
  if (length) {
    stream.node.timestamp = Date.now();
  }
  return i;
}}, default_tty_ops:{get_char:function(tty) {
  if (!tty.input.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
      var BUFSIZE = 256;
      var buf = Buffer.alloc(BUFSIZE);
      var bytesRead = 0;
      try {
        bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, -1);
      } catch (e) {
        if (e.toString().includes("EOF")) {
          bytesRead = 0;
        } else {
          throw e;
        }
      }
      if (bytesRead > 0) {
        result = buf.slice(0, bytesRead).toString("utf-8");
      } else {
        result = null;
      }
    } else if (typeof window != "undefined" && typeof window.prompt == "function") {
      result = window.prompt("Input: ");
      if (result !== null) {
        result += "\n";
      }
    } else if (typeof readline == "function") {
      result = readline();
      if (result !== null) {
        result += "\n";
      }
    }
    if (!result) {
      return null;
    }
    tty.input = intArrayFromString(result, true);
  }
  return tty.input.shift();
}, put_char:function(tty, val) {
  if (val === null || val === 10) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
  } else {
    if (val != 0) {
      tty.output.push(val);
    }
  }
}, fsync:function(tty) {
  if (tty.output && tty.output.length > 0) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
  }
}}, default_tty1_ops:{put_char:function(tty, val) {
  if (val === null || val === 10) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
  } else {
    if (val != 0) {
      tty.output.push(val);
    }
  }
}, fsync:function(tty) {
  if (tty.output && tty.output.length > 0) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
  }
}}};
function zeroMemory(address, size) {
  if (!HEAPU8.fill) {
    for (var i = 0; i < size; i++) {
      HEAPU8[address + i] = 0;
    }
    return;
  }
  HEAPU8.fill(0, address, address + size);
  return address;
}
function alignMemory(size, alignment) {
  return Math.ceil(size / alignment) * alignment;
}
function mmapAlloc(size) {
  abort();
}
var MEMFS = {ops_table:null, mount:function(mount) {
  return MEMFS.createNode(null, "/", 16384 | 511, 0);
}, createNode:function(parent, name, mode, dev) {
  if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
    throw new FS.ErrnoError(63);
  }
  if (!MEMFS.ops_table) {
    MEMFS.ops_table = {dir:{node:{getattr:MEMFS.node_ops.getattr, setattr:MEMFS.node_ops.setattr, lookup:MEMFS.node_ops.lookup, mknod:MEMFS.node_ops.mknod, rename:MEMFS.node_ops.rename, unlink:MEMFS.node_ops.unlink, rmdir:MEMFS.node_ops.rmdir, readdir:MEMFS.node_ops.readdir, symlink:MEMFS.node_ops.symlink}, stream:{llseek:MEMFS.stream_ops.llseek}}, file:{node:{getattr:MEMFS.node_ops.getattr, setattr:MEMFS.node_ops.setattr}, stream:{llseek:MEMFS.stream_ops.llseek, read:MEMFS.stream_ops.read, write:MEMFS.stream_ops.write, 
    allocate:MEMFS.stream_ops.allocate, mmap:MEMFS.stream_ops.mmap, msync:MEMFS.stream_ops.msync}}, link:{node:{getattr:MEMFS.node_ops.getattr, setattr:MEMFS.node_ops.setattr, readlink:MEMFS.node_ops.readlink}, stream:{}}, chrdev:{node:{getattr:MEMFS.node_ops.getattr, setattr:MEMFS.node_ops.setattr}, stream:FS.chrdev_stream_ops}};
  }
  var node = FS.createNode(parent, name, mode, dev);
  if (FS.isDir(node.mode)) {
    node.node_ops = MEMFS.ops_table.dir.node;
    node.stream_ops = MEMFS.ops_table.dir.stream;
    node.contents = {};
  } else if (FS.isFile(node.mode)) {
    node.node_ops = MEMFS.ops_table.file.node;
    node.stream_ops = MEMFS.ops_table.file.stream;
    node.usedBytes = 0;
    node.contents = null;
  } else if (FS.isLink(node.mode)) {
    node.node_ops = MEMFS.ops_table.link.node;
    node.stream_ops = MEMFS.ops_table.link.stream;
  } else if (FS.isChrdev(node.mode)) {
    node.node_ops = MEMFS.ops_table.chrdev.node;
    node.stream_ops = MEMFS.ops_table.chrdev.stream;
  }
  node.timestamp = Date.now();
  if (parent) {
    parent.contents[name] = node;
    parent.timestamp = node.timestamp;
  }
  return node;
}, getFileDataAsTypedArray:function(node) {
  if (!node.contents) {
    return new Uint8Array(0);
  }
  if (node.contents.subarray) {
    return node.contents.subarray(0, node.usedBytes);
  }
  return new Uint8Array(node.contents);
}, expandFileStorage:function(node, newCapacity) {
  var prevCapacity = node.contents ? node.contents.length : 0;
  if (prevCapacity >= newCapacity) {
    return;
  }
  var CAPACITY_DOUBLING_MAX = 1024 * 1024;
  newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125) >>> 0);
  if (prevCapacity != 0) {
    newCapacity = Math.max(newCapacity, 256);
  }
  var oldContents = node.contents;
  node.contents = new Uint8Array(newCapacity);
  if (node.usedBytes > 0) {
    node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
  }
}, resizeFileStorage:function(node, newSize) {
  if (node.usedBytes == newSize) {
    return;
  }
  if (newSize == 0) {
    node.contents = null;
    node.usedBytes = 0;
  } else {
    var oldContents = node.contents;
    node.contents = new Uint8Array(newSize);
    if (oldContents) {
      node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
    }
    node.usedBytes = newSize;
  }
}, node_ops:{getattr:function(node) {
  var attr = {};
  attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
  attr.ino = node.id;
  attr.mode = node.mode;
  attr.nlink = 1;
  attr.uid = 0;
  attr.gid = 0;
  attr.rdev = node.rdev;
  if (FS.isDir(node.mode)) {
    attr.size = 4096;
  } else if (FS.isFile(node.mode)) {
    attr.size = node.usedBytes;
  } else if (FS.isLink(node.mode)) {
    attr.size = node.link.length;
  } else {
    attr.size = 0;
  }
  attr.atime = new Date(node.timestamp);
  attr.mtime = new Date(node.timestamp);
  attr.ctime = new Date(node.timestamp);
  attr.blksize = 4096;
  attr.blocks = Math.ceil(attr.size / attr.blksize);
  return attr;
}, setattr:function(node, attr) {
  if (attr.mode !== undefined) {
    node.mode = attr.mode;
  }
  if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
  }
  if (attr.size !== undefined) {
    MEMFS.resizeFileStorage(node, attr.size);
  }
}, lookup:function(parent, name) {
  throw FS.genericErrors[44];
}, mknod:function(parent, name, mode, dev) {
  return MEMFS.createNode(parent, name, mode, dev);
}, rename:function(old_node, new_dir, new_name) {
  if (FS.isDir(old_node.mode)) {
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {
    }
    if (new_node) {
      for (var i in new_node.contents) {
        throw new FS.ErrnoError(55);
      }
    }
  }
  delete old_node.parent.contents[old_node.name];
  old_node.parent.timestamp = Date.now();
  old_node.name = new_name;
  new_dir.contents[new_name] = old_node;
  new_dir.timestamp = old_node.parent.timestamp;
  old_node.parent = new_dir;
}, unlink:function(parent, name) {
  delete parent.contents[name];
  parent.timestamp = Date.now();
}, rmdir:function(parent, name) {
  var node = FS.lookupNode(parent, name);
  for (var i in node.contents) {
    throw new FS.ErrnoError(55);
  }
  delete parent.contents[name];
  parent.timestamp = Date.now();
}, readdir:function(node) {
  var entries = [".", ".."];
  for (var key in node.contents) {
    if (!node.contents.hasOwnProperty(key)) {
      continue;
    }
    entries.push(key);
  }
  return entries;
}, symlink:function(parent, newname, oldpath) {
  var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
  node.link = oldpath;
  return node;
}, readlink:function(node) {
  if (!FS.isLink(node.mode)) {
    throw new FS.ErrnoError(28);
  }
  return node.link;
}}, stream_ops:{read:function(stream, buffer, offset, length, position) {
  var contents = stream.node.contents;
  if (position >= stream.node.usedBytes) {
    return 0;
  }
  var size = Math.min(stream.node.usedBytes - position, length);
  if (size > 8 && contents.subarray) {
    buffer.set(contents.subarray(position, position + size), offset);
  } else {
    for (var i = 0; i < size; i++) {
      buffer[offset + i] = contents[position + i];
    }
  }
  return size;
}, write:function(stream, buffer, offset, length, position, canOwn) {
  if (buffer.buffer === HEAP8.buffer) {
    canOwn = false;
  }
  if (!length) {
    return 0;
  }
  var node = stream.node;
  node.timestamp = Date.now();
  if (buffer.subarray && (!node.contents || node.contents.subarray)) {
    if (canOwn) {
      node.contents = buffer.subarray(offset, offset + length);
      node.usedBytes = length;
      return length;
    } else if (node.usedBytes === 0 && position === 0) {
      node.contents = buffer.slice(offset, offset + length);
      node.usedBytes = length;
      return length;
    } else if (position + length <= node.usedBytes) {
      node.contents.set(buffer.subarray(offset, offset + length), position);
      return length;
    }
  }
  MEMFS.expandFileStorage(node, position + length);
  if (node.contents.subarray && buffer.subarray) {
    node.contents.set(buffer.subarray(offset, offset + length), position);
  } else {
    for (var i = 0; i < length; i++) {
      node.contents[position + i] = buffer[offset + i];
    }
  }
  node.usedBytes = Math.max(node.usedBytes, position + length);
  return length;
}, llseek:function(stream, offset, whence) {
  var position = offset;
  if (whence === 1) {
    position += stream.position;
  } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
      position += stream.node.usedBytes;
    }
  }
  if (position < 0) {
    throw new FS.ErrnoError(28);
  }
  return position;
}, allocate:function(stream, offset, length) {
  MEMFS.expandFileStorage(stream.node, offset + length);
  stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
}, mmap:function(stream, length, position, prot, flags) {
  if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(43);
  }
  var ptr;
  var allocated;
  var contents = stream.node.contents;
  if (!(flags & 2) && contents.buffer === buffer) {
    allocated = false;
    ptr = contents.byteOffset;
  } else {
    if (position > 0 || position + length < contents.length) {
      if (contents.subarray) {
        contents = contents.subarray(position, position + length);
      } else {
        contents = Array.prototype.slice.call(contents, position, position + length);
      }
    }
    allocated = true;
    ptr = mmapAlloc(length);
    if (!ptr) {
      throw new FS.ErrnoError(48);
    }
    HEAP8.set(contents, ptr);
  }
  return {ptr:ptr, allocated:allocated};
}, msync:function(stream, buffer, offset, length, mmapFlags) {
  MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
  return 0;
}}};
function asyncLoad(url, onload, onerror, noRunDep) {
  var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
  readAsync(url, function(arrayBuffer) {
    assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
    onload(new Uint8Array(arrayBuffer));
    if (dep) {
      removeRunDependency(dep);
    }
  }, function(event) {
    if (onerror) {
      onerror();
    } else {
      throw 'Loading data file "' + url + '" failed.';
    }
  });
  if (dep) {
    addRunDependency(dep);
  }
}
var FS = {root:null, mounts:[], devices:{}, streams:[], nextInode:1, nameTable:null, currentPath:"/", initialized:false, ignorePermissions:true, ErrnoError:null, genericErrors:{}, filesystems:null, syncFSRequests:0, lookupPath:function(path, opts) {
  opts = opts === void 0 ? {} : opts;
  path = PATH_FS.resolve(path);
  if (!path) {
    return {path:"", node:null};
  }
  var defaults = {follow_mount:true, recurse_count:0};
  opts = Object.assign(defaults, opts);
  if (opts.recurse_count > 8) {
    throw new FS.ErrnoError(32);
  }
  var parts = path.split("/").filter(function(p) {
    return !!p;
  });
  var current = FS.root;
  var current_path = "/";
  for (var i = 0; i < parts.length; i++) {
    var islast = i === parts.length - 1;
    if (islast && opts.parent) {
      break;
    }
    current = FS.lookupNode(current, parts[i]);
    current_path = PATH.join2(current_path, parts[i]);
    if (FS.isMountpoint(current)) {
      if (!islast || islast && opts.follow_mount) {
        current = current.mounted.root;
      }
    }
    if (!islast || opts.follow) {
      var count = 0;
      while (FS.isLink(current.mode)) {
        var link = FS.readlink(current_path);
        current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
        var lookup = FS.lookupPath(current_path, {recurse_count:opts.recurse_count + 1});
        current = lookup.node;
        if (count++ > 40) {
          throw new FS.ErrnoError(32);
        }
      }
    }
  }
  return {path:current_path, node:current};
}, getPath:function(node) {
  var path;
  while (true) {
    if (FS.isRoot(node)) {
      var mount = node.mount.mountpoint;
      if (!path) {
        return mount;
      }
      return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
    }
    path = path ? node.name + "/" + path : node.name;
    node = node.parent;
  }
}, hashName:function(parentid, name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
  }
  return (parentid + hash >>> 0) % FS.nameTable.length;
}, hashAddNode:function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  node.name_next = FS.nameTable[hash];
  FS.nameTable[hash] = node;
}, hashRemoveNode:function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  if (FS.nameTable[hash] === node) {
    FS.nameTable[hash] = node.name_next;
  } else {
    var current = FS.nameTable[hash];
    while (current) {
      if (current.name_next === node) {
        current.name_next = node.name_next;
        break;
      }
      current = current.name_next;
    }
  }
}, lookupNode:function(parent, name) {
  var errCode = FS.mayLookup(parent);
  if (errCode) {
    throw new FS.ErrnoError(errCode, parent);
  }
  var hash = FS.hashName(parent.id, name);
  for (var node = FS.nameTable[hash]; node; node = node.name_next) {
    var nodeName = node.name;
    if (node.parent.id === parent.id && nodeName === name) {
      return node;
    }
  }
  return FS.lookup(parent, name);
}, createNode:function(parent, name, mode, rdev) {
  var node = new FS.FSNode(parent, name, mode, rdev);
  FS.hashAddNode(node);
  return node;
}, destroyNode:function(node) {
  FS.hashRemoveNode(node);
}, isRoot:function(node) {
  return node === node.parent;
}, isMountpoint:function(node) {
  return !!node.mounted;
}, isFile:function(mode) {
  return (mode & 61440) === 32768;
}, isDir:function(mode) {
  return (mode & 61440) === 16384;
}, isLink:function(mode) {
  return (mode & 61440) === 40960;
}, isChrdev:function(mode) {
  return (mode & 61440) === 8192;
}, isBlkdev:function(mode) {
  return (mode & 61440) === 24576;
}, isFIFO:function(mode) {
  return (mode & 61440) === 4096;
}, isSocket:function(mode) {
  return (mode & 49152) === 49152;
}, flagModes:{"r":0, "r+":2, "w":577, "w+":578, "a":1089, "a+":1090}, modeStringToFlags:function(str) {
  var flags = FS.flagModes[str];
  if (typeof flags == "undefined") {
    throw new Error("Unknown file open mode: " + str);
  }
  return flags;
}, flagsToPermissionString:function(flag) {
  var perms = ["r", "w", "rw"][flag & 3];
  if (flag & 512) {
    perms += "w";
  }
  return perms;
}, nodePermissions:function(node, perms) {
  if (FS.ignorePermissions) {
    return 0;
  }
  if (perms.includes("r") && !(node.mode & 292)) {
    return 2;
  } else if (perms.includes("w") && !(node.mode & 146)) {
    return 2;
  } else if (perms.includes("x") && !(node.mode & 73)) {
    return 2;
  }
  return 0;
}, mayLookup:function(dir) {
  var errCode = FS.nodePermissions(dir, "x");
  if (errCode) {
    return errCode;
  }
  if (!dir.node_ops.lookup) {
    return 2;
  }
  return 0;
}, mayCreate:function(dir, name) {
  try {
    var node = FS.lookupNode(dir, name);
    return 20;
  } catch (e) {
  }
  return FS.nodePermissions(dir, "wx");
}, mayDelete:function(dir, name, isdir) {
  var node;
  try {
    node = FS.lookupNode(dir, name);
  } catch (e) {
    return e.errno;
  }
  var errCode = FS.nodePermissions(dir, "wx");
  if (errCode) {
    return errCode;
  }
  if (isdir) {
    if (!FS.isDir(node.mode)) {
      return 54;
    }
    if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
      return 10;
    }
  } else {
    if (FS.isDir(node.mode)) {
      return 31;
    }
  }
  return 0;
}, mayOpen:function(node, flags) {
  if (!node) {
    return 44;
  }
  if (FS.isLink(node.mode)) {
    return 32;
  } else if (FS.isDir(node.mode)) {
    if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
      return 31;
    }
  }
  return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
}, MAX_OPEN_FDS:4096, nextfd:function(fd_start, fd_end) {
  fd_start = fd_start === void 0 ? 0 : fd_start;
  fd_end = fd_end === void 0 ? FS.MAX_OPEN_FDS : fd_end;
  for (var fd = fd_start; fd <= fd_end; fd++) {
    if (!FS.streams[fd]) {
      return fd;
    }
  }
  throw new FS.ErrnoError(33);
}, getStream:function(fd) {
  return FS.streams[fd];
}, createStream:function(stream, fd_start, fd_end) {
  if (!FS.FSStream) {
    FS.FSStream = function() {
      this.shared = {};
    };
    FS.FSStream.prototype = {};
    Object.defineProperties(FS.FSStream.prototype, {object:{get:function() {
      return this.node;
    }, set:function(val) {
      this.node = val;
    }}, isRead:{get:function() {
      return (this.flags & 2097155) !== 1;
    }}, isWrite:{get:function() {
      return (this.flags & 2097155) !== 0;
    }}, isAppend:{get:function() {
      return this.flags & 1024;
    }}, flags:{get:function() {
      return this.shared.flags;
    }, set:function(val) {
      this.shared.flags = val;
    },}, position:{get:function() {
      return this.shared.position;
    }, set:function(val) {
      this.shared.position = val;
    },},});
  }
  stream = Object.assign(new FS.FSStream(), stream);
  var fd = FS.nextfd(fd_start, fd_end);
  stream.fd = fd;
  FS.streams[fd] = stream;
  return stream;
}, closeStream:function(fd) {
  FS.streams[fd] = null;
}, chrdev_stream_ops:{open:function(stream) {
  var device = FS.getDevice(stream.node.rdev);
  stream.stream_ops = device.stream_ops;
  if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
  }
}, llseek:function() {
  throw new FS.ErrnoError(70);
}}, major:function(dev) {
  return dev >> 8;
}, minor:function(dev) {
  return dev & 255;
}, makedev:function(ma, mi) {
  return ma << 8 | mi;
}, registerDevice:function(dev, ops) {
  FS.devices[dev] = {stream_ops:ops};
}, getDevice:function(dev) {
  return FS.devices[dev];
}, getMounts:function(mount) {
  var mounts = [];
  var check = [mount];
  while (check.length) {
    var m = check.pop();
    mounts.push(m);
    check.push.apply(check, m.mounts);
  }
  return mounts;
}, syncfs:function(populate, callback) {
  if (typeof populate == "function") {
    callback = populate;
    populate = false;
  }
  FS.syncFSRequests++;
  if (FS.syncFSRequests > 1) {
    err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
  }
  var mounts = FS.getMounts(FS.root.mount);
  var completed = 0;
  function doCallback(errCode) {
    FS.syncFSRequests--;
    return callback(errCode);
  }
  function done(errCode) {
    if (errCode) {
      if (!done.errored) {
        done.errored = true;
        return doCallback(errCode);
      }
      return;
    }
    if (++completed >= mounts.length) {
      doCallback(null);
    }
  }
  mounts.forEach(function(mount) {
    if (!mount.type.syncfs) {
      return done(null);
    }
    mount.type.syncfs(mount, populate, done);
  });
}, mount:function(type, opts, mountpoint) {
  var root = mountpoint === "/";
  var pseudo = !mountpoint;
  var node;
  if (root && FS.root) {
    throw new FS.ErrnoError(10);
  } else if (!root && !pseudo) {
    var lookup = FS.lookupPath(mountpoint, {follow_mount:false});
    mountpoint = lookup.path;
    node = lookup.node;
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    if (!FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
  }
  var mount = {type:type, opts:opts, mountpoint:mountpoint, mounts:[]};
  var mountRoot = type.mount(mount);
  mountRoot.mount = mount;
  mount.root = mountRoot;
  if (root) {
    FS.root = mountRoot;
  } else if (node) {
    node.mounted = mount;
    if (node.mount) {
      node.mount.mounts.push(mount);
    }
  }
  return mountRoot;
}, unmount:function(mountpoint) {
  var lookup = FS.lookupPath(mountpoint, {follow_mount:false});
  if (!FS.isMountpoint(lookup.node)) {
    throw new FS.ErrnoError(28);
  }
  var node = lookup.node;
  var mount = node.mounted;
  var mounts = FS.getMounts(mount);
  Object.keys(FS.nameTable).forEach(function(hash) {
    var current = FS.nameTable[hash];
    while (current) {
      var next = current.name_next;
      if (mounts.includes(current.mount)) {
        FS.destroyNode(current);
      }
      current = next;
    }
  });
  node.mounted = null;
  var idx = node.mount.mounts.indexOf(mount);
  node.mount.mounts.splice(idx, 1);
}, lookup:function(parent, name) {
  return parent.node_ops.lookup(parent, name);
}, mknod:function(path, mode, dev) {
  var lookup = FS.lookupPath(path, {parent:true});
  var parent = lookup.node;
  var name = PATH.basename(path);
  if (!name || name === "." || name === "..") {
    throw new FS.ErrnoError(28);
  }
  var errCode = FS.mayCreate(parent, name);
  if (errCode) {
    throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.mknod) {
    throw new FS.ErrnoError(63);
  }
  return parent.node_ops.mknod(parent, name, mode, dev);
}, create:function(path, mode) {
  mode = mode !== undefined ? mode : 438;
  mode &= 4095;
  mode |= 32768;
  return FS.mknod(path, mode, 0);
}, mkdir:function(path, mode) {
  mode = mode !== undefined ? mode : 511;
  mode &= 511 | 512;
  mode |= 16384;
  return FS.mknod(path, mode, 0);
}, mkdirTree:function(path, mode) {
  var dirs = path.split("/");
  var d = "";
  for (var i = 0; i < dirs.length; ++i) {
    if (!dirs[i]) {
      continue;
    }
    d += "/" + dirs[i];
    try {
      FS.mkdir(d, mode);
    } catch (e) {
      if (e.errno != 20) {
        throw e;
      }
    }
  }
}, mkdev:function(path, mode, dev) {
  if (typeof dev == "undefined") {
    dev = mode;
    mode = 438;
  }
  mode |= 8192;
  return FS.mknod(path, mode, dev);
}, symlink:function(oldpath, newpath) {
  if (!PATH_FS.resolve(oldpath)) {
    throw new FS.ErrnoError(44);
  }
  var lookup = FS.lookupPath(newpath, {parent:true});
  var parent = lookup.node;
  if (!parent) {
    throw new FS.ErrnoError(44);
  }
  var newname = PATH.basename(newpath);
  var errCode = FS.mayCreate(parent, newname);
  if (errCode) {
    throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.symlink) {
    throw new FS.ErrnoError(63);
  }
  return parent.node_ops.symlink(parent, newname, oldpath);
}, rename:function(old_path, new_path) {
  var old_dirname = PATH.dirname(old_path);
  var new_dirname = PATH.dirname(new_path);
  var old_name = PATH.basename(old_path);
  var new_name = PATH.basename(new_path);
  var lookup, old_dir, new_dir;
  lookup = FS.lookupPath(old_path, {parent:true});
  old_dir = lookup.node;
  lookup = FS.lookupPath(new_path, {parent:true});
  new_dir = lookup.node;
  if (!old_dir || !new_dir) {
    throw new FS.ErrnoError(44);
  }
  if (old_dir.mount !== new_dir.mount) {
    throw new FS.ErrnoError(75);
  }
  var old_node = FS.lookupNode(old_dir, old_name);
  var relative = PATH_FS.relative(old_path, new_dirname);
  if (relative.charAt(0) !== ".") {
    throw new FS.ErrnoError(28);
  }
  relative = PATH_FS.relative(new_path, old_dirname);
  if (relative.charAt(0) !== ".") {
    throw new FS.ErrnoError(55);
  }
  var new_node;
  try {
    new_node = FS.lookupNode(new_dir, new_name);
  } catch (e) {
  }
  if (old_node === new_node) {
    return;
  }
  var isdir = FS.isDir(old_node.mode);
  var errCode = FS.mayDelete(old_dir, old_name, isdir);
  if (errCode) {
    throw new FS.ErrnoError(errCode);
  }
  errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
  if (errCode) {
    throw new FS.ErrnoError(errCode);
  }
  if (!old_dir.node_ops.rename) {
    throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
    throw new FS.ErrnoError(10);
  }
  if (new_dir !== old_dir) {
    errCode = FS.nodePermissions(old_dir, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
  }
  FS.hashRemoveNode(old_node);
  try {
    old_dir.node_ops.rename(old_node, new_dir, new_name);
  } catch (e$1) {
    throw e$1;
  } finally {
    FS.hashAddNode(old_node);
  }
}, rmdir:function(path) {
  var lookup = FS.lookupPath(path, {parent:true});
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var errCode = FS.mayDelete(parent, name, true);
  if (errCode) {
    throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.rmdir) {
    throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(10);
  }
  parent.node_ops.rmdir(parent, name);
  FS.destroyNode(node);
}, readdir:function(path) {
  var lookup = FS.lookupPath(path, {follow:true});
  var node = lookup.node;
  if (!node.node_ops.readdir) {
    throw new FS.ErrnoError(54);
  }
  return node.node_ops.readdir(node);
}, unlink:function(path) {
  var lookup = FS.lookupPath(path, {parent:true});
  var parent = lookup.node;
  if (!parent) {
    throw new FS.ErrnoError(44);
  }
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var errCode = FS.mayDelete(parent, name, false);
  if (errCode) {
    throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.unlink) {
    throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(10);
  }
  parent.node_ops.unlink(parent, name);
  FS.destroyNode(node);
}, readlink:function(path) {
  var lookup = FS.lookupPath(path);
  var link = lookup.node;
  if (!link) {
    throw new FS.ErrnoError(44);
  }
  if (!link.node_ops.readlink) {
    throw new FS.ErrnoError(28);
  }
  return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
}, stat:function(path, dontFollow) {
  var lookup = FS.lookupPath(path, {follow:!dontFollow});
  var node = lookup.node;
  if (!node) {
    throw new FS.ErrnoError(44);
  }
  if (!node.node_ops.getattr) {
    throw new FS.ErrnoError(63);
  }
  return node.node_ops.getattr(node);
}, lstat:function(path) {
  return FS.stat(path, true);
}, chmod:function(path, mode, dontFollow) {
  var node;
  if (typeof path == "string") {
    var lookup = FS.lookupPath(path, {follow:!dontFollow});
    node = lookup.node;
  } else {
    node = path;
  }
  if (!node.node_ops.setattr) {
    throw new FS.ErrnoError(63);
  }
  node.node_ops.setattr(node, {mode:mode & 4095 | node.mode & ~4095, timestamp:Date.now()});
}, lchmod:function(path, mode) {
  FS.chmod(path, mode, true);
}, fchmod:function(fd, mode) {
  var stream = FS.getStream(fd);
  if (!stream) {
    throw new FS.ErrnoError(8);
  }
  FS.chmod(stream.node, mode);
}, chown:function(path, uid, gid, dontFollow) {
  var node;
  if (typeof path == "string") {
    var lookup = FS.lookupPath(path, {follow:!dontFollow});
    node = lookup.node;
  } else {
    node = path;
  }
  if (!node.node_ops.setattr) {
    throw new FS.ErrnoError(63);
  }
  node.node_ops.setattr(node, {timestamp:Date.now()});
}, lchown:function(path, uid, gid) {
  FS.chown(path, uid, gid, true);
}, fchown:function(fd, uid, gid) {
  var stream = FS.getStream(fd);
  if (!stream) {
    throw new FS.ErrnoError(8);
  }
  FS.chown(stream.node, uid, gid);
}, truncate:function(path, len) {
  if (len < 0) {
    throw new FS.ErrnoError(28);
  }
  var node;
  if (typeof path == "string") {
    var lookup = FS.lookupPath(path, {follow:true});
    node = lookup.node;
  } else {
    node = path;
  }
  if (!node.node_ops.setattr) {
    throw new FS.ErrnoError(63);
  }
  if (FS.isDir(node.mode)) {
    throw new FS.ErrnoError(31);
  }
  if (!FS.isFile(node.mode)) {
    throw new FS.ErrnoError(28);
  }
  var errCode = FS.nodePermissions(node, "w");
  if (errCode) {
    throw new FS.ErrnoError(errCode);
  }
  node.node_ops.setattr(node, {size:len, timestamp:Date.now()});
}, ftruncate:function(fd, len) {
  var stream = FS.getStream(fd);
  if (!stream) {
    throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 0) {
    throw new FS.ErrnoError(28);
  }
  FS.truncate(stream.node, len);
}, utime:function(path, atime, mtime) {
  var lookup = FS.lookupPath(path, {follow:true});
  var node = lookup.node;
  node.node_ops.setattr(node, {timestamp:Math.max(atime, mtime)});
}, open:function(path, flags, mode) {
  if (path === "") {
    throw new FS.ErrnoError(44);
  }
  flags = typeof flags == "string" ? FS.modeStringToFlags(flags) : flags;
  mode = typeof mode == "undefined" ? 438 : mode;
  if (flags & 64) {
    mode = mode & 4095 | 32768;
  } else {
    mode = 0;
  }
  var node;
  if (typeof path == "object") {
    node = path;
  } else {
    path = PATH.normalize(path);
    try {
      var lookup = FS.lookupPath(path, {follow:!(flags & 131072)});
      node = lookup.node;
    } catch (e) {
    }
  }
  var created = false;
  if (flags & 64) {
    if (node) {
      if (flags & 128) {
        throw new FS.ErrnoError(20);
      }
    } else {
      node = FS.mknod(path, mode, 0);
      created = true;
    }
  }
  if (!node) {
    throw new FS.ErrnoError(44);
  }
  if (FS.isChrdev(node.mode)) {
    flags &= ~512;
  }
  if (flags & 65536 && !FS.isDir(node.mode)) {
    throw new FS.ErrnoError(54);
  }
  if (!created) {
    var errCode = FS.mayOpen(node, flags);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
  }
  if (flags & 512 && !created) {
    FS.truncate(node, 0);
  }
  flags &= ~(128 | 512 | 131072);
  var stream = FS.createStream({node:node, path:FS.getPath(node), flags:flags, seekable:true, position:0, stream_ops:node.stream_ops, ungotten:[], error:false});
  if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
  }
  if (Module["logReadFiles"] && !(flags & 1)) {
    if (!FS.readFiles) {
      FS.readFiles = {};
    }
    if (!(path in FS.readFiles)) {
      FS.readFiles[path] = 1;
    }
  }
  return stream;
}, close:function(stream) {
  if (FS.isClosed(stream)) {
    throw new FS.ErrnoError(8);
  }
  if (stream.getdents) {
    stream.getdents = null;
  }
  try {
    if (stream.stream_ops.close) {
      stream.stream_ops.close(stream);
    }
  } catch (e) {
    throw e;
  } finally {
    FS.closeStream(stream.fd);
  }
  stream.fd = null;
}, isClosed:function(stream) {
  return stream.fd === null;
}, llseek:function(stream, offset, whence) {
  if (FS.isClosed(stream)) {
    throw new FS.ErrnoError(8);
  }
  if (!stream.seekable || !stream.stream_ops.llseek) {
    throw new FS.ErrnoError(70);
  }
  if (whence != 0 && whence != 1 && whence != 2) {
    throw new FS.ErrnoError(28);
  }
  stream.position = stream.stream_ops.llseek(stream, offset, whence);
  stream.ungotten = [];
  return stream.position;
}, read:function(stream, buffer, offset, length, position) {
  if (length < 0 || position < 0) {
    throw new FS.ErrnoError(28);
  }
  if (FS.isClosed(stream)) {
    throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 1) {
    throw new FS.ErrnoError(8);
  }
  if (FS.isDir(stream.node.mode)) {
    throw new FS.ErrnoError(31);
  }
  if (!stream.stream_ops.read) {
    throw new FS.ErrnoError(28);
  }
  var seeking = typeof position != "undefined";
  if (!seeking) {
    position = stream.position;
  } else if (!stream.seekable) {
    throw new FS.ErrnoError(70);
  }
  var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
  if (!seeking) {
    stream.position += bytesRead;
  }
  return bytesRead;
}, write:function(stream, buffer, offset, length, position, canOwn) {
  if (length < 0 || position < 0) {
    throw new FS.ErrnoError(28);
  }
  if (FS.isClosed(stream)) {
    throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 0) {
    throw new FS.ErrnoError(8);
  }
  if (FS.isDir(stream.node.mode)) {
    throw new FS.ErrnoError(31);
  }
  if (!stream.stream_ops.write) {
    throw new FS.ErrnoError(28);
  }
  if (stream.seekable && stream.flags & 1024) {
    FS.llseek(stream, 0, 2);
  }
  var seeking = typeof position != "undefined";
  if (!seeking) {
    position = stream.position;
  } else if (!stream.seekable) {
    throw new FS.ErrnoError(70);
  }
  var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
  if (!seeking) {
    stream.position += bytesWritten;
  }
  return bytesWritten;
}, allocate:function(stream, offset, length) {
  if (FS.isClosed(stream)) {
    throw new FS.ErrnoError(8);
  }
  if (offset < 0 || length <= 0) {
    throw new FS.ErrnoError(28);
  }
  if ((stream.flags & 2097155) === 0) {
    throw new FS.ErrnoError(8);
  }
  if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
    throw new FS.ErrnoError(43);
  }
  if (!stream.stream_ops.allocate) {
    throw new FS.ErrnoError(138);
  }
  stream.stream_ops.allocate(stream, offset, length);
}, mmap:function(stream, length, position, prot, flags) {
  if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
    throw new FS.ErrnoError(2);
  }
  if ((stream.flags & 2097155) === 1) {
    throw new FS.ErrnoError(2);
  }
  if (!stream.stream_ops.mmap) {
    throw new FS.ErrnoError(43);
  }
  return stream.stream_ops.mmap(stream, length, position, prot, flags);
}, msync:function(stream, buffer, offset, length, mmapFlags) {
  if (!stream.stream_ops.msync) {
    return 0;
  }
  return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
}, munmap:function(stream) {
  return 0;
}, ioctl:function(stream, cmd, arg) {
  if (!stream.stream_ops.ioctl) {
    throw new FS.ErrnoError(59);
  }
  return stream.stream_ops.ioctl(stream, cmd, arg);
}, readFile:function(path, opts) {
  opts = opts === void 0 ? {} : opts;
  opts.flags = opts.flags || 0;
  opts.encoding = opts.encoding || "binary";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
    throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var ret;
  var stream = FS.open(path, opts.flags);
  var stat = FS.stat(path);
  var length = stat.size;
  var buf = new Uint8Array(length);
  FS.read(stream, buf, 0, length, 0);
  if (opts.encoding === "utf8") {
    ret = UTF8ArrayToString(buf, 0);
  } else if (opts.encoding === "binary") {
    ret = buf;
  }
  FS.close(stream);
  return ret;
}, writeFile:function(path, data, opts) {
  opts = opts === void 0 ? {} : opts;
  opts.flags = opts.flags || 577;
  var stream = FS.open(path, opts.flags, opts.mode);
  if (typeof data == "string") {
    var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
    var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
    FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
  } else if (ArrayBuffer.isView(data)) {
    FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
  } else {
    throw new Error("Unsupported data type");
  }
  FS.close(stream);
}, cwd:function() {
  return FS.currentPath;
}, chdir:function(path) {
  var lookup = FS.lookupPath(path, {follow:true});
  if (lookup.node === null) {
    throw new FS.ErrnoError(44);
  }
  if (!FS.isDir(lookup.node.mode)) {
    throw new FS.ErrnoError(54);
  }
  var errCode = FS.nodePermissions(lookup.node, "x");
  if (errCode) {
    throw new FS.ErrnoError(errCode);
  }
  FS.currentPath = lookup.path;
}, createDefaultDirectories:function() {
  FS.mkdir("/tmp");
  FS.mkdir("/home");
  FS.mkdir("/home/web_user");
}, createDefaultDevices:function() {
  FS.mkdir("/dev");
  FS.registerDevice(FS.makedev(1, 3), {read:function() {
    return 0;
  }, write:function(stream, buffer, offset, length, pos) {
    return length;
  },});
  FS.mkdev("/dev/null", FS.makedev(1, 3));
  TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
  TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
  FS.mkdev("/dev/tty", FS.makedev(5, 0));
  FS.mkdev("/dev/tty1", FS.makedev(6, 0));
  var random_device = getRandomDevice();
  FS.createDevice("/dev", "random", random_device);
  FS.createDevice("/dev", "urandom", random_device);
  FS.mkdir("/dev/shm");
  FS.mkdir("/dev/shm/tmp");
}, createSpecialDirectories:function() {
  FS.mkdir("/proc");
  var proc_self = FS.mkdir("/proc/self");
  FS.mkdir("/proc/self/fd");
  FS.mount({mount:function() {
    var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
    node.node_ops = {lookup:function(parent, name) {
      var fd = +name;
      var stream = FS.getStream(fd);
      if (!stream) {
        throw new FS.ErrnoError(8);
      }
      var ret = {parent:null, mount:{mountpoint:"fake"}, node_ops:{readlink:function() {
        return stream.path;
      }},};
      ret.parent = ret;
      return ret;
    }};
    return node;
  }}, {}, "/proc/self/fd");
}, createStandardStreams:function() {
  if (Module["stdin"]) {
    FS.createDevice("/dev", "stdin", Module["stdin"]);
  } else {
    FS.symlink("/dev/tty", "/dev/stdin");
  }
  if (Module["stdout"]) {
    FS.createDevice("/dev", "stdout", null, Module["stdout"]);
  } else {
    FS.symlink("/dev/tty", "/dev/stdout");
  }
  if (Module["stderr"]) {
    FS.createDevice("/dev", "stderr", null, Module["stderr"]);
  } else {
    FS.symlink("/dev/tty1", "/dev/stderr");
  }
  var stdin = FS.open("/dev/stdin", 0);
  var stdout = FS.open("/dev/stdout", 1);
  var stderr = FS.open("/dev/stderr", 1);
}, ensureErrnoError:function() {
  if (FS.ErrnoError) {
    return;
  }
  FS.ErrnoError = function ErrnoError(errno, node) {
    this.node = node;
    this.setErrno = function(errno) {
      this.errno = errno;
    };
    this.setErrno(errno);
    this.message = "FS error";
  };
  FS.ErrnoError.prototype = new Error();
  FS.ErrnoError.prototype.constructor = FS.ErrnoError;
  [44].forEach(function(code) {
    FS.genericErrors[code] = new FS.ErrnoError(code);
    FS.genericErrors[code].stack = "<generic error, no stack>";
  });
}, staticInit:function() {
  FS.ensureErrnoError();
  FS.nameTable = new Array(4096);
  FS.mount(MEMFS, {}, "/");
  FS.createDefaultDirectories();
  FS.createDefaultDevices();
  FS.createSpecialDirectories();
  FS.filesystems = {"MEMFS":MEMFS,};
}, init:function(input, output, error) {
  FS.init.initialized = true;
  FS.ensureErrnoError();
  Module["stdin"] = input || Module["stdin"];
  Module["stdout"] = output || Module["stdout"];
  Module["stderr"] = error || Module["stderr"];
  FS.createStandardStreams();
}, quit:function() {
  FS.init.initialized = false;
  for (var i = 0; i < FS.streams.length; i++) {
    var stream = FS.streams[i];
    if (!stream) {
      continue;
    }
    FS.close(stream);
  }
}, getMode:function(canRead, canWrite) {
  var mode = 0;
  if (canRead) {
    mode |= 292 | 73;
  }
  if (canWrite) {
    mode |= 146;
  }
  return mode;
}, findObject:function(path, dontResolveLastLink) {
  var ret = FS.analyzePath(path, dontResolveLastLink);
  if (!ret.exists) {
    return null;
  }
  return ret.object;
}, analyzePath:function(path, dontResolveLastLink) {
  try {
    var lookup = FS.lookupPath(path, {follow:!dontResolveLastLink});
    path = lookup.path;
  } catch (e) {
  }
  var ret = {isRoot:false, exists:false, error:0, name:null, path:null, object:null, parentExists:false, parentPath:null, parentObject:null};
  try {
    var lookup = FS.lookupPath(path, {parent:true});
    ret.parentExists = true;
    ret.parentPath = lookup.path;
    ret.parentObject = lookup.node;
    ret.name = PATH.basename(path);
    lookup = FS.lookupPath(path, {follow:!dontResolveLastLink});
    ret.exists = true;
    ret.path = lookup.path;
    ret.object = lookup.node;
    ret.name = lookup.node.name;
    ret.isRoot = lookup.path === "/";
  } catch (e$2) {
    ret.error = e$2.errno;
  }
  return ret;
}, createPath:function(parent, path, canRead, canWrite) {
  parent = typeof parent == "string" ? parent : FS.getPath(parent);
  var parts = path.split("/").reverse();
  while (parts.length) {
    var part = parts.pop();
    if (!part) {
      continue;
    }
    var current = PATH.join2(parent, part);
    try {
      FS.mkdir(current);
    } catch (e) {
    }
    parent = current;
  }
  return current;
}, createFile:function(parent, name, properties, canRead, canWrite) {
  var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.create(path, mode);
}, createDataFile:function(parent, name, data, canRead, canWrite, canOwn) {
  var path = name;
  if (parent) {
    parent = typeof parent == "string" ? parent : FS.getPath(parent);
    path = name ? PATH.join2(parent, name) : parent;
  }
  var mode = FS.getMode(canRead, canWrite);
  var node = FS.create(path, mode);
  if (data) {
    if (typeof data == "string") {
      var arr = new Array(data.length);
      for (var i = 0, len = data.length; i < len; ++i) {
        arr[i] = data.charCodeAt(i);
      }
      data = arr;
    }
    FS.chmod(node, mode | 146);
    var stream = FS.open(node, 577);
    FS.write(stream, data, 0, data.length, 0, canOwn);
    FS.close(stream);
    FS.chmod(node, mode);
  }
  return node;
}, createDevice:function(parent, name, input, output) {
  var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(!!input, !!output);
  if (!FS.createDevice.major) {
    FS.createDevice.major = 64;
  }
  var dev = FS.makedev(FS.createDevice.major++, 0);
  FS.registerDevice(dev, {open:function(stream) {
    stream.seekable = false;
  }, close:function(stream) {
    if (output && output.buffer && output.buffer.length) {
      output(10);
    }
  }, read:function(stream, buffer, offset, length, pos) {
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
      var result;
      try {
        result = input();
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (result === undefined && bytesRead === 0) {
        throw new FS.ErrnoError(6);
      }
      if (result === null || result === undefined) {
        break;
      }
      bytesRead++;
      buffer[offset + i] = result;
    }
    if (bytesRead) {
      stream.node.timestamp = Date.now();
    }
    return bytesRead;
  }, write:function(stream, buffer, offset, length, pos) {
    for (var i = 0; i < length; i++) {
      try {
        output(buffer[offset + i]);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    }
    if (length) {
      stream.node.timestamp = Date.now();
    }
    return i;
  }});
  return FS.mkdev(path, mode, dev);
}, forceLoadFile:function(obj) {
  if (obj.isDevice || obj.isFolder || obj.link || obj.contents) {
    return true;
  }
  if (typeof XMLHttpRequest != "undefined") {
    throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
  } else if (read_) {
    try {
      obj.contents = intArrayFromString(read_(obj.url), true);
      obj.usedBytes = obj.contents.length;
    } catch (e) {
      throw new FS.ErrnoError(29);
    }
  } else {
    throw new Error("Cannot load without read() or XMLHttpRequest.");
  }
}, createLazyFile:function(parent, name, url, canRead, canWrite) {
  function LazyUint8Array() {
    this.lengthKnown = false;
    this.chunks = [];
  }
  LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
    if (idx > this.length - 1 || idx < 0) {
      return undefined;
    }
    var chunkOffset = idx % this.chunkSize;
    var chunkNum = idx / this.chunkSize | 0;
    return this.getter(chunkNum)[chunkOffset];
  };
  LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
    this.getter = getter;
  };
  LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
    var xhr = new XMLHttpRequest();
    xhr.open("HEAD", url, false);
    xhr.send(null);
    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) {
      throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    }
    var datalength = Number(xhr.getResponseHeader("Content-length"));
    var header;
    var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
    var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
    var chunkSize = 1024 * 1024;
    if (!hasByteServing) {
      chunkSize = datalength;
    }
    var doXHR = function(from, to) {
      if (from > to) {
        throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
      }
      if (to > datalength - 1) {
        throw new Error("only " + datalength + " bytes available! programmer error!");
      }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      if (datalength !== chunkSize) {
        xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
      }
      xhr.responseType = "arraybuffer";
      if (xhr.overrideMimeType) {
        xhr.overrideMimeType("text/plain; charset=x-user-defined");
      }
      xhr.send(null);
      if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) {
        throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
      }
      if (xhr.response !== undefined) {
        return new Uint8Array(xhr.response || []);
      }
      return intArrayFromString(xhr.responseText || "", true);
    };
    var lazyArray = this;
    lazyArray.setDataGetter(function(chunkNum) {
      var start = chunkNum * chunkSize;
      var end = (chunkNum + 1) * chunkSize - 1;
      end = Math.min(end, datalength - 1);
      if (typeof lazyArray.chunks[chunkNum] == "undefined") {
        lazyArray.chunks[chunkNum] = doXHR(start, end);
      }
      if (typeof lazyArray.chunks[chunkNum] == "undefined") {
        throw new Error("doXHR failed!");
      }
      return lazyArray.chunks[chunkNum];
    });
    if (usesGzip || !datalength) {
      chunkSize = datalength = 1;
      datalength = this.getter(0).length;
      chunkSize = datalength;
      out("LazyFiles on gzip forces download of the whole file when length is accessed");
    }
    this._length = datalength;
    this._chunkSize = chunkSize;
    this.lengthKnown = true;
  };
  if (typeof XMLHttpRequest != "undefined") {
    if (!ENVIRONMENT_IS_WORKER) {
      throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
    }
    var lazyArray = new LazyUint8Array();
    Object.defineProperties(lazyArray, {length:{get:function() {
      if (!this.lengthKnown) {
        this.cacheLength();
      }
      return this._length;
    }}, chunkSize:{get:function() {
      if (!this.lengthKnown) {
        this.cacheLength();
      }
      return this._chunkSize;
    }}});
    var properties = {isDevice:false, contents:lazyArray};
  } else {
    var properties = {isDevice:false, url:url};
  }
  var node = FS.createFile(parent, name, properties, canRead, canWrite);
  if (properties.contents) {
    node.contents = properties.contents;
  } else if (properties.url) {
    node.contents = null;
    node.url = properties.url;
  }
  Object.defineProperties(node, {usedBytes:{get:function() {
    return this.contents.length;
  }}});
  var stream_ops = {};
  var keys = Object.keys(node.stream_ops);
  keys.forEach(function(key) {
    var fn = node.stream_ops[key];
    stream_ops[key] = function forceLoadLazyFile() {
      FS.forceLoadFile(node);
      return fn.apply(null, arguments);
    };
  });
  function writeChunks(stream, buffer, offset, length, position) {
    var contents = stream.node.contents;
    if (position >= contents.length) {
      return 0;
    }
    var size = Math.min(contents.length - position, length);
    if (contents.slice) {
      for (var i = 0; i < size; i++) {
        buffer[offset + i] = contents[position + i];
      }
    } else {
      for (var i = 0; i < size; i++) {
        buffer[offset + i] = contents.get(position + i);
      }
    }
    return size;
  }
  stream_ops.read = function(stream, buffer, offset, length, position) {
    FS.forceLoadFile(node);
    return writeChunks(stream, buffer, offset, length, position);
  };
  stream_ops.mmap = function(stream, length, position, prot, flags) {
    FS.forceLoadFile(node);
    var ptr = mmapAlloc(length);
    if (!ptr) {
      throw new FS.ErrnoError(48);
    }
    writeChunks(stream, HEAP8, ptr, length, position);
    return {ptr:ptr, allocated:true};
  };
  node.stream_ops = stream_ops;
  return node;
}, createPreloadedFile:function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
  var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency("cp " + fullname);
  function processData(byteArray) {
    function finish(byteArray) {
      if (preFinish) {
        preFinish();
      }
      if (!dontCreateFile) {
        FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
      }
      if (onload) {
        onload();
      }
      removeRunDependency(dep);
    }
    if (Browser.handledByPreloadPlugin(byteArray, fullname, finish, function() {
      if (onerror) {
        onerror();
      }
      removeRunDependency(dep);
    })) {
      return;
    }
    finish(byteArray);
  }
  addRunDependency(dep);
  if (typeof url == "string") {
    asyncLoad(url, function(byteArray) {
      return processData(byteArray);
    }, onerror);
  } else {
    processData(url);
  }
}, indexedDB:function() {
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
}, DB_NAME:function() {
  return "EM_FS_" + window.location.pathname;
}, DB_VERSION:20, DB_STORE_NAME:"FILE_DATA", saveFilesToDB:function(paths, onload, onerror) {
  onload = onload || function() {
  };
  onerror = onerror || function() {
  };
  var indexedDB = FS.indexedDB();
  try {
    var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
    return onerror(e);
  }
  openRequest.onupgradeneeded = function() {
    out("creating db");
    var db = openRequest.result;
    db.createObjectStore(FS.DB_STORE_NAME);
  };
  openRequest.onsuccess = function() {
    var db = openRequest.result;
    var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
    var files = transaction.objectStore(FS.DB_STORE_NAME);
    var ok = 0, fail = 0, total = paths.length;
    function finish() {
      if (fail == 0) {
        onload();
      } else {
        onerror();
      }
    }
    paths.forEach(function(path) {
      var putRequest = files.put(FS.analyzePath(path).object.contents, path);
      putRequest.onsuccess = function() {
        ok++;
        if (ok + fail == total) {
          finish();
        }
      };
      putRequest.onerror = function() {
        fail++;
        if (ok + fail == total) {
          finish();
        }
      };
    });
    transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
}, loadFilesFromDB:function(paths, onload, onerror) {
  onload = onload || function() {
  };
  onerror = onerror || function() {
  };
  var indexedDB = FS.indexedDB();
  try {
    var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
    return onerror(e);
  }
  openRequest.onupgradeneeded = onerror;
  openRequest.onsuccess = function() {
    var db = openRequest.result;
    try {
      var transaction = db.transaction([FS.DB_STORE_NAME], "readonly");
    } catch (e$3) {
      onerror(e$3);
      return;
    }
    var files = transaction.objectStore(FS.DB_STORE_NAME);
    var ok = 0, fail = 0, total = paths.length;
    function finish() {
      if (fail == 0) {
        onload();
      } else {
        onerror();
      }
    }
    paths.forEach(function(path) {
      var getRequest = files.get(path);
      getRequest.onsuccess = function() {
        if (FS.analyzePath(path).exists) {
          FS.unlink(path);
        }
        FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
        ok++;
        if (ok + fail == total) {
          finish();
        }
      };
      getRequest.onerror = function() {
        fail++;
        if (ok + fail == total) {
          finish();
        }
      };
    });
    transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
}};
var SYSCALLS = {DEFAULT_POLLMASK:5, calculateAt:function(dirfd, path, allowEmpty) {
  if (PATH.isAbs(path)) {
    return path;
  }
  var dir;
  if (dirfd === -100) {
    dir = FS.cwd();
  } else {
    var dirstream = SYSCALLS.getStreamFromFD(dirfd);
    dir = dirstream.path;
  }
  if (path.length == 0) {
    if (!allowEmpty) {
      throw new FS.ErrnoError(44);
    }
    return dir;
  }
  return PATH.join2(dir, path);
}, doStat:function(func, path, buf) {
  try {
    var stat = func(path);
  } catch (e) {
    if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
      return -54;
    }
    throw e;
  }
  HEAP32[buf >> 2] = stat.dev;
  HEAP32[buf + 8 >> 2] = stat.ino;
  HEAP32[buf + 12 >> 2] = stat.mode;
  HEAPU32[buf + 16 >> 2] = stat.nlink;
  HEAP32[buf + 20 >> 2] = stat.uid;
  HEAP32[buf + 24 >> 2] = stat.gid;
  HEAP32[buf + 28 >> 2] = stat.rdev;
  tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1.0 ? tempDouble > 0.0 ? (Math.min(+Math.floor(tempDouble / 4294967296.0), 4294967295.0) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296.0) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
  HEAP32[buf + 48 >> 2] = 4096;
  HEAP32[buf + 52 >> 2] = stat.blocks;
  var atime = stat.atime.getTime();
  var mtime = stat.mtime.getTime();
  var ctime = stat.ctime.getTime();
  tempI64 = [Math.floor(atime / 1000) >>> 0, (tempDouble = Math.floor(atime / 1000), +Math.abs(tempDouble) >= 1.0 ? tempDouble > 0.0 ? (Math.min(+Math.floor(tempDouble / 4294967296.0), 4294967295.0) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296.0) >>> 0 : 0)], HEAP32[buf + 56 >> 2] = tempI64[0], HEAP32[buf + 60 >> 2] = tempI64[1];
  HEAPU32[buf + 64 >> 2] = atime % 1000 * 1000;
  tempI64 = [Math.floor(mtime / 1000) >>> 0, (tempDouble = Math.floor(mtime / 1000), +Math.abs(tempDouble) >= 1.0 ? tempDouble > 0.0 ? (Math.min(+Math.floor(tempDouble / 4294967296.0), 4294967295.0) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296.0) >>> 0 : 0)], HEAP32[buf + 72 >> 2] = tempI64[0], HEAP32[buf + 76 >> 2] = tempI64[1];
  HEAPU32[buf + 80 >> 2] = mtime % 1000 * 1000;
  tempI64 = [Math.floor(ctime / 1000) >>> 0, (tempDouble = Math.floor(ctime / 1000), +Math.abs(tempDouble) >= 1.0 ? tempDouble > 0.0 ? (Math.min(+Math.floor(tempDouble / 4294967296.0), 4294967295.0) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296.0) >>> 0 : 0)], HEAP32[buf + 88 >> 2] = tempI64[0], HEAP32[buf + 92 >> 2] = tempI64[1];
  HEAPU32[buf + 96 >> 2] = ctime % 1000 * 1000;
  tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1.0 ? tempDouble > 0.0 ? (Math.min(+Math.floor(tempDouble / 4294967296.0), 4294967295.0) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296.0) >>> 0 : 0)], HEAP32[buf + 104 >> 2] = tempI64[0], HEAP32[buf + 108 >> 2] = tempI64[1];
  return 0;
}, doMsync:function(addr, stream, len, flags, offset) {
  if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(43);
  }
  if (flags & 2) {
    return 0;
  }
  var buffer = HEAPU8.slice(addr, addr + len);
  FS.msync(stream, buffer, offset, len, flags);
}, varargs:undefined, get:function() {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
}, getStr:function(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
}, getStreamFromFD:function(fd) {
  var stream = FS.getStream(fd);
  if (!stream) {
    throw new FS.ErrnoError(8);
  }
  return stream;
}};
function _proc_exit(code) {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    if (Module["onExit"]) {
      Module["onExit"](code);
    }
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
}
function exitJS(status, implicit) {
  EXITSTATUS = status;
  _proc_exit(status);
}
var _exit = exitJS;
function handleException(e) {
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  quit_(1, e);
}
function maybeExit() {
}
function setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) {
  assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
  Browser.mainLoop.func = browserIterationFunc;
  Browser.mainLoop.arg = arg;
  var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  function checkIsRunning() {
    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
      maybeExit();
      return false;
    }
    return true;
  }
  Browser.mainLoop.running = false;
  Browser.mainLoop.runner = function Browser_mainLoop_runner() {
    if (ABORT) {
      return;
    }
    if (Browser.mainLoop.queue.length > 0) {
      var start = Date.now();
      var blocker = Browser.mainLoop.queue.shift();
      blocker.func(blocker.arg);
      if (Browser.mainLoop.remainingBlockers) {
        var remaining = Browser.mainLoop.remainingBlockers;
        var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
        if (blocker.counted) {
          Browser.mainLoop.remainingBlockers = next;
        } else {
          next = next + 0.5;
          Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
        }
      }
      out('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
      Browser.mainLoop.updateStatus();
      if (!checkIsRunning()) {
        return;
      }
      setTimeout(Browser.mainLoop.runner, 0);
      return;
    }
    if (!checkIsRunning()) {
      return;
    }
    Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
    if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
      Browser.mainLoop.scheduler();
      return;
    } else if (Browser.mainLoop.timingMode == 0) {
      Browser.mainLoop.tickStartTime = _emscripten_get_now();
    }
    Browser.mainLoop.runIter(browserIterationFunc);
    if (!checkIsRunning()) {
      return;
    }
    if (typeof SDL == "object" && SDL.audio && SDL.audio.queueNewAudioData) {
      SDL.audio.queueNewAudioData();
    }
    Browser.mainLoop.scheduler();
  };
  if (!noSetTiming) {
    if (fps && fps > 0) {
      _emscripten_set_main_loop_timing(0, 1000.0 / fps);
    } else {
      _emscripten_set_main_loop_timing(1, 1);
    }
    Browser.mainLoop.scheduler();
  }
  if (simulateInfiniteLoop) {
    throw "unwind";
  }
}
function callUserCallback(func) {
  if (ABORT) {
    return;
  }
  try {
    func();
  } catch (e) {
    handleException(e);
  }
}
function safeSetTimeout(func, timeout) {
  return setTimeout(function() {
    callUserCallback(func);
  }, timeout);
}
function warnOnce(text) {
  if (!warnOnce.shown) {
    warnOnce.shown = {};
  }
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    if (ENVIRONMENT_IS_NODE) {
      text = "warning: " + text;
    }
    err(text);
  }
}
var Browser = {mainLoop:{running:false, scheduler:null, method:"", currentlyRunningMainloop:0, func:null, arg:0, timingMode:0, timingValue:0, currentFrameNumber:0, queue:[], pause:function() {
  Browser.mainLoop.scheduler = null;
  Browser.mainLoop.currentlyRunningMainloop++;
}, resume:function() {
  Browser.mainLoop.currentlyRunningMainloop++;
  var timingMode = Browser.mainLoop.timingMode;
  var timingValue = Browser.mainLoop.timingValue;
  var func = Browser.mainLoop.func;
  Browser.mainLoop.func = null;
  setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
  _emscripten_set_main_loop_timing(timingMode, timingValue);
  Browser.mainLoop.scheduler();
}, updateStatus:function() {
  if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
      if (remaining < expected) {
        Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
      } else {
        Module["setStatus"](message);
      }
    } else {
      Module["setStatus"]("");
    }
  }
}, runIter:function(func) {
  if (ABORT) {
    return;
  }
  if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
      return;
    }
  }
  callUserCallback(func);
  if (Module["postMainLoop"]) {
    Module["postMainLoop"]();
  }
}}, isFullscreen:false, pointerLock:false, moduleContextCreatedCallbacks:[], workers:[], init:function() {
  if (!Module["preloadPlugins"]) {
    Module["preloadPlugins"] = [];
  }
  if (Browser.initted) {
    return;
  }
  Browser.initted = true;
  try {
    new Blob();
    Browser.hasBlobConstructor = true;
  } catch (e) {
    Browser.hasBlobConstructor = false;
    err("warning: no blob constructor, cannot create blobs with mimetypes");
  }
  Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? err("warning: no BlobBuilder") : null;
  Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
  if (!Module.noImageDecoding && typeof Browser.URLObject == "undefined") {
    err("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
    Module.noImageDecoding = true;
  }
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
    return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
    var b = null;
    if (Browser.hasBlobConstructor) {
      try {
        b = new Blob([byteArray], {type:Browser.getMimetype(name)});
        if (b.size !== byteArray.length) {
          b = new Blob([(new Uint8Array(byteArray)).buffer], {type:Browser.getMimetype(name)});
        }
      } catch (e$4) {
        warnOnce("Blob constructor present but fails: " + e$4 + "; falling back to blob builder");
      }
    }
    if (!b) {
      var bb = new Browser.BlobBuilder();
      bb.append((new Uint8Array(byteArray)).buffer);
      b = bb.getBlob();
    }
    var url = Browser.URLObject.createObjectURL(b);
    var img = new Image();
    img.onload = function() {
      assert(img.complete, "Image " + name + " could not be decoded");
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      preloadedImages[name] = canvas;
      Browser.URLObject.revokeObjectURL(url);
      if (onload) {
        onload(byteArray);
      }
    };
    img.onerror = function(event) {
      out("Image " + url + " could not be decoded");
      if (onerror) {
        onerror();
      }
    };
    img.src = url;
  };
  Module["preloadPlugins"].push(imagePlugin);
  var audioPlugin = {};
  audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
    return !Module.noAudioDecoding && name.substr(-4) in {".ogg":1, ".wav":1, ".mp3":1};
  };
  audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
    var done = false;
    function finish(audio) {
      if (done) {
        return;
      }
      done = true;
      preloadedAudios[name] = audio;
      if (onload) {
        onload(byteArray);
      }
    }
    function fail() {
      if (done) {
        return;
      }
      done = true;
      preloadedAudios[name] = new Audio();
      if (onerror) {
        onerror();
      }
    }
    if (Browser.hasBlobConstructor) {
      try {
        var b = new Blob([byteArray], {type:Browser.getMimetype(name)});
      } catch (e$5) {
        return fail();
      }
      var url = Browser.URLObject.createObjectURL(b);
      var audio = new Audio();
      audio.addEventListener("canplaythrough", function() {
        return finish(audio);
      }, false);
      audio.onerror = function audio_onerror(event) {
        if (done) {
          return;
        }
        err("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
        function encode64(data) {
          var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          var PAD = "=";
          var ret = "";
          var leftchar = 0;
          var leftbits = 0;
          for (var i = 0; i < data.length; i++) {
            leftchar = leftchar << 8 | data[i];
            leftbits += 8;
            while (leftbits >= 6) {
              var curr = leftchar >> leftbits - 6 & 63;
              leftbits -= 6;
              ret += BASE[curr];
            }
          }
          if (leftbits == 2) {
            ret += BASE[(leftchar & 3) << 4];
            ret += PAD + PAD;
          } else if (leftbits == 4) {
            ret += BASE[(leftchar & 15) << 2];
            ret += PAD;
          }
          return ret;
        }
        audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
        finish(audio);
      };
      audio.src = url;
      safeSetTimeout(function() {
        finish(audio);
      }, 10000);
    } else {
      return fail();
    }
  };
  Module["preloadPlugins"].push(audioPlugin);
  function pointerLockChange() {
    Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"];
  }
  var canvas = Module["canvas"];
  if (canvas) {
    canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || function() {
    };
    canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || function() {
    };
    canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
    document.addEventListener("pointerlockchange", pointerLockChange, false);
    document.addEventListener("mozpointerlockchange", pointerLockChange, false);
    document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
    document.addEventListener("mspointerlockchange", pointerLockChange, false);
    if (Module["elementPointerLock"]) {
      canvas.addEventListener("click", function(ev) {
        if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
          Module["canvas"].requestPointerLock();
          ev.preventDefault();
        }
      }, false);
    }
  }
}, handledByPreloadPlugin:function(byteArray, fullname, finish, onerror) {
  Browser.init();
  var handled = false;
  Module["preloadPlugins"].forEach(function(plugin) {
    if (handled) {
      return;
    }
    if (plugin["canHandle"](fullname)) {
      plugin["handle"](byteArray, fullname, finish, onerror);
      handled = true;
    }
  });
  return handled;
}, createContext:function(canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && Module.ctx && canvas == Module.canvas) {
    return Module.ctx;
  }
  var ctx;
  var contextHandle;
  if (useWebGL) {
    var contextAttributes = {antialias:false, alpha:false, majorVersion:1,};
    if (webGLContextAttributes) {
      for (var attribute in webGLContextAttributes) {
        contextAttributes[attribute] = webGLContextAttributes[attribute];
      }
    }
    if (typeof GL != "undefined") {
      contextHandle = GL.createContext(canvas, contextAttributes);
      if (contextHandle) {
        ctx = GL.getContext(contextHandle).GLctx;
      }
    }
  } else {
    ctx = canvas.getContext("2d");
  }
  if (!ctx) {
    return null;
  }
  if (setInModule) {
    if (!useWebGL) {
      assert(typeof GLctx == "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
    }
    Module.ctx = ctx;
    if (useWebGL) {
      GL.makeContextCurrent(contextHandle);
    }
    Module.useWebGL = useWebGL;
    Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
      callback();
    });
    Browser.init();
  }
  return ctx;
}, destroyContext:function(canvas, useWebGL, setInModule) {
}, fullscreenHandlersInstalled:false, lockPointer:undefined, resizeCanvas:undefined, requestFullscreen:function(lockPointer, resizeCanvas) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  if (typeof Browser.lockPointer == "undefined") {
    Browser.lockPointer = true;
  }
  if (typeof Browser.resizeCanvas == "undefined") {
    Browser.resizeCanvas = false;
  }
  var canvas = Module["canvas"];
  function fullscreenChange() {
    Browser.isFullscreen = false;
    var canvasContainer = canvas.parentNode;
    if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
      canvas.exitFullscreen = Browser.exitFullscreen;
      if (Browser.lockPointer) {
        canvas.requestPointerLock();
      }
      Browser.isFullscreen = true;
      if (Browser.resizeCanvas) {
        Browser.setFullscreenCanvasSize();
      } else {
        Browser.updateCanvasDimensions(canvas);
      }
    } else {
      canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
      canvasContainer.parentNode.removeChild(canvasContainer);
      if (Browser.resizeCanvas) {
        Browser.setWindowedCanvasSize();
      } else {
        Browser.updateCanvasDimensions(canvas);
      }
    }
    if (Module["onFullScreen"]) {
      Module["onFullScreen"](Browser.isFullscreen);
    }
    if (Module["onFullscreen"]) {
      Module["onFullscreen"](Browser.isFullscreen);
    }
  }
  if (!Browser.fullscreenHandlersInstalled) {
    Browser.fullscreenHandlersInstalled = true;
    document.addEventListener("fullscreenchange", fullscreenChange, false);
    document.addEventListener("mozfullscreenchange", fullscreenChange, false);
    document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
    document.addEventListener("MSFullscreenChange", fullscreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? function() {
    return canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]);
  } : null) || (canvasContainer["webkitRequestFullScreen"] ? function() {
    return canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
  } : null);
  canvasContainer.requestFullscreen();
}, exitFullscreen:function() {
  if (!Browser.isFullscreen) {
    return false;
  }
  var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function() {
  };
  CFS.apply(document, []);
  return true;
}, nextRAF:0, fakeRequestAnimationFrame:function(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
    Browser.nextRAF = now + 1000 / 60;
  } else {
    while (now + 2 >= Browser.nextRAF) {
      Browser.nextRAF += 1000 / 60;
    }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
}, requestAnimationFrame:function(func) {
  if (typeof requestAnimationFrame == "function") {
    requestAnimationFrame(func);
    return;
  }
  var RAF = Browser.fakeRequestAnimationFrame;
  if (typeof window != "undefined") {
    RAF = window["requestAnimationFrame"] || window["mozRequestAnimationFrame"] || window["webkitRequestAnimationFrame"] || window["msRequestAnimationFrame"] || window["oRequestAnimationFrame"] || RAF;
  }
  RAF(func);
}, safeSetTimeout:function(func, timeout) {
  return safeSetTimeout(func, timeout);
}, safeRequestAnimationFrame:function(func) {
  return Browser.requestAnimationFrame(function() {
    callUserCallback(func);
  });
}, getMimetype:function(name) {
  return {"jpg":"image/jpeg", "jpeg":"image/jpeg", "png":"image/png", "bmp":"image/bmp", "ogg":"audio/ogg", "wav":"audio/wav", "mp3":"audio/mpeg"}[name.substr(name.lastIndexOf(".") + 1)];
}, getUserMedia:function(func) {
  if (!window.getUserMedia) {
    window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  }
  window.getUserMedia(func);
}, getMovementX:function(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
}, getMovementY:function(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
}, getMouseWheelDelta:function(event) {
  var delta = 0;
  switch(event.type) {
    case "DOMMouseScroll":
      delta = event.detail / 3;
      break;
    case "mousewheel":
      delta = event.wheelDelta / 120;
      break;
    case "wheel":
      delta = event.deltaY;
      switch(event.deltaMode) {
        case 0:
          delta /= 100;
          break;
        case 1:
          delta /= 3;
          break;
        case 2:
          delta *= 80;
          break;
        default:
          throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
      }break;
    default:
      throw "unrecognized mouse wheel event: " + event.type;
  }
  return delta;
}, mouseX:0, mouseY:0, mouseMovementX:0, mouseMovementY:0, touches:{}, lastTouches:{}, calculateMouseEvent:function(event) {
  if (Browser.pointerLock) {
    if (event.type != "mousemove" && "mozMovementX" in event) {
      Browser.mouseMovementX = Browser.mouseMovementY = 0;
    } else {
      Browser.mouseMovementX = Browser.getMovementX(event);
      Browser.mouseMovementY = Browser.getMovementY(event);
    }
    if (typeof SDL != "undefined") {
      Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
      Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
    } else {
      Browser.mouseX += Browser.mouseMovementX;
      Browser.mouseY += Browser.mouseMovementY;
    }
  } else {
    var rect = Module["canvas"].getBoundingClientRect();
    var cw = Module["canvas"].width;
    var ch = Module["canvas"].height;
    var scrollX = typeof window.scrollX != "undefined" ? window.scrollX : window.pageXOffset;
    var scrollY = typeof window.scrollY != "undefined" ? window.scrollY : window.pageYOffset;
    if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
      var touch = event.touch;
      if (touch === undefined) {
        return;
      }
      var adjustedX = touch.pageX - (scrollX + rect.left);
      var adjustedY = touch.pageY - (scrollY + rect.top);
      adjustedX = adjustedX * (cw / rect.width);
      adjustedY = adjustedY * (ch / rect.height);
      var coords = {x:adjustedX, y:adjustedY};
      if (event.type === "touchstart") {
        Browser.lastTouches[touch.identifier] = coords;
        Browser.touches[touch.identifier] = coords;
      } else if (event.type === "touchend" || event.type === "touchmove") {
        var last = Browser.touches[touch.identifier];
        if (!last) {
          last = coords;
        }
        Browser.lastTouches[touch.identifier] = last;
        Browser.touches[touch.identifier] = coords;
      }
      return;
    }
    var x = event.pageX - (scrollX + rect.left);
    var y = event.pageY - (scrollY + rect.top);
    x = x * (cw / rect.width);
    y = y * (ch / rect.height);
    Browser.mouseMovementX = x - Browser.mouseX;
    Browser.mouseMovementY = y - Browser.mouseY;
    Browser.mouseX = x;
    Browser.mouseY = y;
  }
}, resizeListeners:[], updateResizeListeners:function() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach(function(listener) {
    listener(canvas.width, canvas.height);
  });
}, setCanvasSize:function(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) {
    Browser.updateResizeListeners();
  }
}, windowedWidth:0, windowedHeight:0, setFullscreenCanvasSize:function() {
  if (typeof SDL != "undefined") {
    var flags = HEAPU32[SDL.screen >> 2];
    flags = flags | 8388608;
    HEAP32[SDL.screen >> 2] = flags;
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
}, setWindowedCanvasSize:function() {
  if (typeof SDL != "undefined") {
    var flags = HEAPU32[SDL.screen >> 2];
    flags = flags & ~8388608;
    HEAP32[SDL.screen >> 2] = flags;
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
}, updateCanvasDimensions:function(canvas, wNative, hNative) {
  if (wNative && hNative) {
    canvas.widthNative = wNative;
    canvas.heightNative = hNative;
  } else {
    wNative = canvas.widthNative;
    hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
    if (w / h < Module["forcedAspectRatio"]) {
      w = Math.round(h * Module["forcedAspectRatio"]);
    } else {
      h = Math.round(w / Module["forcedAspectRatio"]);
    }
  }
  if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
    var factor = Math.min(screen.width / w, screen.height / h);
    w = Math.round(w * factor);
    h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
    if (canvas.width != w) {
      canvas.width = w;
    }
    if (canvas.height != h) {
      canvas.height = h;
    }
    if (typeof canvas.style != "undefined") {
      canvas.style.removeProperty("width");
      canvas.style.removeProperty("height");
    }
  } else {
    if (canvas.width != wNative) {
      canvas.width = wNative;
    }
    if (canvas.height != hNative) {
      canvas.height = hNative;
    }
    if (typeof canvas.style != "undefined") {
      if (w != wNative || h != hNative) {
        canvas.style.setProperty("width", w + "px", "important");
        canvas.style.setProperty("height", h + "px", "important");
      } else {
        canvas.style.removeProperty("width");
        canvas.style.removeProperty("height");
      }
    }
  }
}};
function _emscripten_cancel_main_loop() {
  Browser.mainLoop.pause();
  Browser.mainLoop.func = null;
}
function _emscripten_date_now() {
  return Date.now();
}
function withStackSave(f) {
  var stack = stackSave();
  var ret = f();
  stackRestore(stack);
  return ret;
}
var JSEvents = {inEventHandler:0, removeAllEventListeners:function() {
  for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
    JSEvents._removeHandler(i);
  }
  JSEvents.eventHandlers = [];
  JSEvents.deferredCalls = [];
}, registerRemoveEventListeners:function() {
  if (!JSEvents.removeEventListenersRegistered) {
    __ATEXIT__.push(JSEvents.removeAllEventListeners);
    JSEvents.removeEventListenersRegistered = true;
  }
}, deferredCalls:[], deferCall:function(targetFunction, precedence, argsList) {
  function arraysHaveEqualContent(arrA, arrB) {
    if (arrA.length != arrB.length) {
      return false;
    }
    for (var i in arrA) {
      if (arrA[i] != arrB[i]) {
        return false;
      }
    }
    return true;
  }
  for (var i in JSEvents.deferredCalls) {
    var call = JSEvents.deferredCalls[i];
    if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
      return;
    }
  }
  JSEvents.deferredCalls.push({targetFunction:targetFunction, precedence:precedence, argsList:argsList});
  JSEvents.deferredCalls.sort(function(x, y) {
    return x.precedence < y.precedence;
  });
}, removeDeferredCalls:function(targetFunction) {
  for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
    if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
      JSEvents.deferredCalls.splice(i, 1);
      --i;
    }
  }
}, canPerformEventHandlerRequests:function() {
  return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
}, runDeferredCalls:function() {
  if (!JSEvents.canPerformEventHandlerRequests()) {
    return;
  }
  for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
    var call = JSEvents.deferredCalls[i];
    JSEvents.deferredCalls.splice(i, 1);
    --i;
    call.targetFunction.apply(null, call.argsList);
  }
}, eventHandlers:[], isInternetExplorer:function() {
  return navigator.userAgent.includes("MSIE") || navigator.appVersion.indexOf("Trident/") > 0;
}, removeAllHandlersOnTarget:function(target, eventTypeString) {
  for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
    if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
      JSEvents._removeHandler(i--);
    }
  }
}, _removeHandler:function(i) {
  var h = JSEvents.eventHandlers[i];
  h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
  JSEvents.eventHandlers.splice(i, 1);
}, registerOrRemoveHandler:function(eventHandler) {
  var jsEventHandler = function jsEventHandler(event) {
    ++JSEvents.inEventHandler;
    JSEvents.currentEventHandler = eventHandler;
    JSEvents.runDeferredCalls();
    eventHandler.handlerFunc(event);
    JSEvents.runDeferredCalls();
    --JSEvents.inEventHandler;
  };
  if (eventHandler.callbackfunc) {
    eventHandler.eventListenerFunc = jsEventHandler;
    eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, { useCapture: eventHandler.useCapture, passive: false });
    JSEvents.eventHandlers.push(eventHandler);
    JSEvents.registerRemoveEventListeners();
  } else {
    for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
      if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
        JSEvents._removeHandler(i--);
      }
    }
  }
}, getNodeNameForTarget:function(target) {
  if (!target) {
    return "";
  }
  if (target == window) {
    return "#window";
  }
  if (target == screen) {
    return "#screen";
  }
  return target && target.nodeName ? target.nodeName : "";
}, fullscreenEnabled:function() {
  return document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled;
}};
var currentFullscreenStrategy = {};
function maybeCStringToJsString(cString) {
  return cString > 2 ? UTF8ToString(cString) : cString;
}
var specialHTMLTargets = [0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0];
function findEventTarget(target) {
  target = maybeCStringToJsString(target);
  var domElement = specialHTMLTargets[target] || (typeof document != "undefined" ? document.querySelector(target) : undefined);
  return domElement;
}
function findCanvasEventTarget(target) {
  return findEventTarget(target);
}
function _emscripten_get_canvas_element_size(target, width, height) {
  var canvas = findCanvasEventTarget(target);
  if (!canvas) {
    return -4;
  }
  HEAP32[width >> 2] = canvas.width;
  HEAP32[height >> 2] = canvas.height;
}
function getCanvasElementSize(target) {
  return withStackSave(function() {
    var w = stackAlloc(8);
    var h = w + 4;
    var targetInt = stackAlloc(target.id.length + 1);
    stringToUTF8(target.id, targetInt, target.id.length + 1);
    var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
    var size = [HEAP32[w >> 2], HEAP32[h >> 2]];
    return size;
  });
}
function _emscripten_set_canvas_element_size(target, width, height) {
  var canvas = findCanvasEventTarget(target);
  if (!canvas) {
    return -4;
  }
  canvas.width = width;
  canvas.height = height;
  return 0;
}
function setCanvasElementSize(target, width, height) {
  if (!target.controlTransferredOffscreen) {
    target.width = width;
    target.height = height;
  } else {
    withStackSave(function() {
      var targetInt = stackAlloc(target.id.length + 1);
      stringToUTF8(target.id, targetInt, target.id.length + 1);
      _emscripten_set_canvas_element_size(targetInt, width, height);
    });
  }
}
var wasmTableMirror = [];
function getWasmTableEntry(funcPtr) {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    if (funcPtr >= wasmTableMirror.length) {
      wasmTableMirror.length = funcPtr + 1;
    }
    wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
  }
  return func;
}
function registerRestoreOldStyle(canvas) {
  var canvasSize = getCanvasElementSize(canvas);
  var oldWidth = canvasSize[0];
  var oldHeight = canvasSize[1];
  var oldCssWidth = canvas.style.width;
  var oldCssHeight = canvas.style.height;
  var oldBackgroundColor = canvas.style.backgroundColor;
  var oldDocumentBackgroundColor = document.body.style.backgroundColor;
  var oldPaddingLeft = canvas.style.paddingLeft;
  var oldPaddingRight = canvas.style.paddingRight;
  var oldPaddingTop = canvas.style.paddingTop;
  var oldPaddingBottom = canvas.style.paddingBottom;
  var oldMarginLeft = canvas.style.marginLeft;
  var oldMarginRight = canvas.style.marginRight;
  var oldMarginTop = canvas.style.marginTop;
  var oldMarginBottom = canvas.style.marginBottom;
  var oldDocumentBodyMargin = document.body.style.margin;
  var oldDocumentOverflow = document.documentElement.style.overflow;
  var oldDocumentScroll = document.body.scroll;
  var oldImageRendering = canvas.style.imageRendering;
  function restoreOldStyle() {
    var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (!fullscreenElement) {
      document.removeEventListener("fullscreenchange", restoreOldStyle);
      document.removeEventListener("mozfullscreenchange", restoreOldStyle);
      document.removeEventListener("webkitfullscreenchange", restoreOldStyle);
      document.removeEventListener("MSFullscreenChange", restoreOldStyle);
      setCanvasElementSize(canvas, oldWidth, oldHeight);
      canvas.style.width = oldCssWidth;
      canvas.style.height = oldCssHeight;
      canvas.style.backgroundColor = oldBackgroundColor;
      if (!oldDocumentBackgroundColor) {
        document.body.style.backgroundColor = "white";
      }
      document.body.style.backgroundColor = oldDocumentBackgroundColor;
      canvas.style.paddingLeft = oldPaddingLeft;
      canvas.style.paddingRight = oldPaddingRight;
      canvas.style.paddingTop = oldPaddingTop;
      canvas.style.paddingBottom = oldPaddingBottom;
      canvas.style.marginLeft = oldMarginLeft;
      canvas.style.marginRight = oldMarginRight;
      canvas.style.marginTop = oldMarginTop;
      canvas.style.marginBottom = oldMarginBottom;
      document.body.style.margin = oldDocumentBodyMargin;
      document.documentElement.style.overflow = oldDocumentOverflow;
      document.body.scroll = oldDocumentScroll;
      canvas.style.imageRendering = oldImageRendering;
      if (canvas.GLctxObject) {
        canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
      }
      if (currentFullscreenStrategy.canvasResizedCallback) {
        getWasmTableEntry(currentFullscreenStrategy.canvasResizedCallback)(37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData);
      }
    }
  }
  document.addEventListener("fullscreenchange", restoreOldStyle);
  document.addEventListener("mozfullscreenchange", restoreOldStyle);
  document.addEventListener("webkitfullscreenchange", restoreOldStyle);
  document.addEventListener("MSFullscreenChange", restoreOldStyle);
  return restoreOldStyle;
}
function setLetterbox(element, topBottom, leftRight) {
  if (JSEvents.isInternetExplorer()) {
    element.style.marginLeft = element.style.marginRight = leftRight + "px";
    element.style.marginTop = element.style.marginBottom = topBottom + "px";
  } else {
    element.style.paddingLeft = element.style.paddingRight = leftRight + "px";
    element.style.paddingTop = element.style.paddingBottom = topBottom + "px";
  }
}
function getBoundingClientRect(e) {
  return specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {"left":0, "top":0};
}
function JSEvents_resizeCanvasForFullscreen(target, strategy) {
  var restoreOldStyle = registerRestoreOldStyle(target);
  var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
  var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
  var rect = getBoundingClientRect(target);
  var windowedCssWidth = rect.right - rect.left;
  var windowedCssHeight = rect.bottom - rect.top;
  var canvasSize = getCanvasElementSize(target);
  var windowedRttWidth = canvasSize[0];
  var windowedRttHeight = canvasSize[1];
  if (strategy.scaleMode == 3) {
    setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
    cssWidth = windowedCssWidth;
    cssHeight = windowedCssHeight;
  } else if (strategy.scaleMode == 2) {
    if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
      var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
      setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
      cssHeight = desiredCssHeight;
    } else {
      var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
      setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
      cssWidth = desiredCssWidth;
    }
  }
  if (!target.style.backgroundColor) {
    target.style.backgroundColor = "black";
  }
  if (!document.body.style.backgroundColor) {
    document.body.style.backgroundColor = "black";
  }
  target.style.width = cssWidth + "px";
  target.style.height = cssHeight + "px";
  if (strategy.filteringMode == 1) {
    target.style.imageRendering = "optimizeSpeed";
    target.style.imageRendering = "-moz-crisp-edges";
    target.style.imageRendering = "-o-crisp-edges";
    target.style.imageRendering = "-webkit-optimize-contrast";
    target.style.imageRendering = "optimize-contrast";
    target.style.imageRendering = "crisp-edges";
    target.style.imageRendering = "pixelated";
  }
  var dpiScale = strategy.canvasResolutionScaleMode == 2 ? devicePixelRatio : 1;
  if (strategy.canvasResolutionScaleMode != 0) {
    var newWidth = cssWidth * dpiScale | 0;
    var newHeight = cssHeight * dpiScale | 0;
    setCanvasElementSize(target, newWidth, newHeight);
    if (target.GLctxObject) {
      target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
    }
  }
  return restoreOldStyle;
}
function JSEvents_requestFullscreen(target, strategy) {
  if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
    JSEvents_resizeCanvasForFullscreen(target, strategy);
  }
  if (target.requestFullscreen) {
    target.requestFullscreen();
  } else if (target.msRequestFullscreen) {
    target.msRequestFullscreen();
  } else if (target.mozRequestFullScreen) {
    target.mozRequestFullScreen();
  } else if (target.mozRequestFullscreen) {
    target.mozRequestFullscreen();
  } else if (target.webkitRequestFullscreen) {
    target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else {
    return JSEvents.fullscreenEnabled() ? -3 : -1;
  }
  currentFullscreenStrategy = strategy;
  if (strategy.canvasResizedCallback) {
    getWasmTableEntry(strategy.canvasResizedCallback)(37, 0, strategy.canvasResizedCallbackUserData);
  }
  return 0;
}
function _emscripten_exit_fullscreen() {
  if (!JSEvents.fullscreenEnabled()) {
    return -1;
  }
  JSEvents.removeDeferredCalls(JSEvents_requestFullscreen);
  var d = specialHTMLTargets[1];
  if (d.exitFullscreen) {
    d.fullscreenElement && d.exitFullscreen();
  } else if (d.msExitFullscreen) {
    d.msFullscreenElement && d.msExitFullscreen();
  } else if (d.mozCancelFullScreen) {
    d.mozFullScreenElement && d.mozCancelFullScreen();
  } else if (d.webkitExitFullscreen) {
    d.webkitFullscreenElement && d.webkitExitFullscreen();
  } else {
    return -1;
  }
  return 0;
}
function requestPointerLock(target) {
  if (target.requestPointerLock) {
    target.requestPointerLock();
  } else if (target.mozRequestPointerLock) {
    target.mozRequestPointerLock();
  } else if (target.webkitRequestPointerLock) {
    target.webkitRequestPointerLock();
  } else if (target.msRequestPointerLock) {
    target.msRequestPointerLock();
  } else {
    if (document.body.requestPointerLock || document.body.mozRequestPointerLock || document.body.webkitRequestPointerLock || document.body.msRequestPointerLock) {
      return -3;
    }
    return -1;
  }
  return 0;
}
function _emscripten_exit_pointerlock() {
  JSEvents.removeDeferredCalls(requestPointerLock);
  if (document.exitPointerLock) {
    document.exitPointerLock();
  } else if (document.msExitPointerLock) {
    document.msExitPointerLock();
  } else if (document.mozExitPointerLock) {
    document.mozExitPointerLock();
  } else if (document.webkitExitPointerLock) {
    document.webkitExitPointerLock();
  } else {
    return -1;
  }
  return 0;
}
function _emscripten_get_device_pixel_ratio() {
  return typeof devicePixelRatio == "number" && devicePixelRatio || 1.0;
}
function _emscripten_get_element_css_size(target, width, height) {
  target = findEventTarget(target);
  if (!target) {
    return -4;
  }
  var rect = getBoundingClientRect(target);
  HEAPF64[width >> 3] = rect.right - rect.left;
  HEAPF64[height >> 3] = rect.bottom - rect.top;
  return 0;
}
function fillFullscreenChangeEventData(eventStruct) {
  var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
  var isFullscreen = !!fullscreenElement;
  HEAP32[eventStruct >> 2] = isFullscreen;
  HEAP32[eventStruct + 4 >> 2] = JSEvents.fullscreenEnabled();
  var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
  var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
  var id = reportedElement && reportedElement.id ? reportedElement.id : "";
  stringToUTF8(nodeName, eventStruct + 8, 128);
  stringToUTF8(id, eventStruct + 136, 128);
  HEAP32[eventStruct + 264 >> 2] = reportedElement ? reportedElement.clientWidth : 0;
  HEAP32[eventStruct + 268 >> 2] = reportedElement ? reportedElement.clientHeight : 0;
  HEAP32[eventStruct + 272 >> 2] = screen.width;
  HEAP32[eventStruct + 276 >> 2] = screen.height;
  if (isFullscreen) {
    JSEvents.previousFullscreenElement = fullscreenElement;
  }
}
function _emscripten_get_fullscreen_status(fullscreenStatus) {
  if (!JSEvents.fullscreenEnabled()) {
    return -1;
  }
  fillFullscreenChangeEventData(fullscreenStatus);
  return 0;
}
function fillPointerlockChangeEventData(eventStruct) {
  var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
  var isPointerlocked = !!pointerLockElement;
  HEAP32[eventStruct >> 2] = isPointerlocked;
  var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
  var id = pointerLockElement && pointerLockElement.id ? pointerLockElement.id : "";
  stringToUTF8(nodeName, eventStruct + 4, 128);
  stringToUTF8(id, eventStruct + 132, 128);
}
function _emscripten_get_pointerlock_status(pointerlockStatus) {
  if (pointerlockStatus) {
    fillPointerlockChangeEventData(pointerlockStatus);
  }
  if (!document.body || !document.body.requestPointerLock && !document.body.mozRequestPointerLock && !document.body.webkitRequestPointerLock && !document.body.msRequestPointerLock) {
    return -1;
  }
  return 0;
}
function _emscripten_is_webgl_context_lost(contextHandle) {
  return !GL.contexts[contextHandle] || GL.contexts[contextHandle].GLctx.isContextLost();
}
var _emscripten_memcpy_big = Uint8Array.prototype.copyWithin ? function(dest, src, num) {
  return HEAPU8.copyWithin(dest, src, src + num);
} : function(dest, src, num) {
  return HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
};
function doRequestFullscreen(target, strategy) {
  if (!JSEvents.fullscreenEnabled()) {
    return -1;
  }
  target = findEventTarget(target);
  if (!target) {
    return -4;
  }
  if (!target.requestFullscreen && !target.msRequestFullscreen && !target.mozRequestFullScreen && !target.mozRequestFullscreen && !target.webkitRequestFullscreen) {
    return -3;
  }
  var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
  if (!canPerformRequests) {
    if (strategy.deferUntilInEventHandler) {
      JSEvents.deferCall(JSEvents_requestFullscreen, 1, [target, strategy]);
      return 1;
    }
    return -2;
  }
  return JSEvents_requestFullscreen(target, strategy);
}
function _emscripten_request_fullscreen_strategy(target, deferUntilInEventHandler, fullscreenStrategy) {
  var strategy = {scaleMode:HEAP32[fullscreenStrategy >> 2], canvasResolutionScaleMode:HEAP32[fullscreenStrategy + 4 >> 2], filteringMode:HEAP32[fullscreenStrategy + 8 >> 2], deferUntilInEventHandler:deferUntilInEventHandler, canvasResizedCallback:HEAP32[fullscreenStrategy + 12 >> 2], canvasResizedCallbackUserData:HEAP32[fullscreenStrategy + 16 >> 2]};
  return doRequestFullscreen(target, strategy);
}
function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
  target = findEventTarget(target);
  if (!target) {
    return -4;
  }
  if (!target.requestPointerLock && !target.mozRequestPointerLock && !target.webkitRequestPointerLock && !target.msRequestPointerLock) {
    return -1;
  }
  var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
  if (!canPerformRequests) {
    if (deferUntilInEventHandler) {
      JSEvents.deferCall(requestPointerLock, 2, [target]);
      return 1;
    }
    return -2;
  }
  return requestPointerLock(target);
}
function getHeapMax() {
  return 2147483648;
}
function emscripten_realloc_buffer(size) {
  try {
    wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
    updateGlobalBufferAndViews(wasmMemory.buffer);
    return 1;
  } catch (e) {
  }
}
function _emscripten_resize_heap(requestedSize) {
  var oldSize = HEAPU8.length;
  requestedSize = requestedSize >>> 0;
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    return false;
  }
  var alignUp = function(x, multiple) {
    return x + (multiple - x % multiple) % multiple;
  };
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
    var replacement = emscripten_realloc_buffer(newSize);
    if (replacement) {
      return true;
    }
  }
  return false;
}
function _emscripten_resume_main_loop() {
  Browser.mainLoop.resume();
}
function registerBeforeUnloadEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) {
  var beforeUnloadEventHandlerFunc = function(ev) {
    var e = ev || event;
    var confirmationMessage = getWasmTableEntry(callbackfunc)(eventTypeId, 0, userData);
    if (confirmationMessage) {
      confirmationMessage = UTF8ToString(confirmationMessage);
    }
    if (confirmationMessage) {
      e.preventDefault();
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  };
  var eventHandler = {target:findEventTarget(target), eventTypeString:eventTypeString, callbackfunc:callbackfunc, handlerFunc:beforeUnloadEventHandlerFunc, useCapture:useCapture};
  JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_beforeunload_callback_on_thread(userData, callbackfunc, targetThread) {
  if (typeof onbeforeunload == "undefined") {
    return -1;
  }
  if (targetThread !== 1) {
    return -5;
  }
  registerBeforeUnloadEventCallback(2, userData, true, callbackfunc, 28, "beforeunload");
  return 0;
}
function registerFocusEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  if (!JSEvents.focusEvent) {
    JSEvents.focusEvent = _malloc(256);
  }
  var focusEventHandlerFunc = function(ev) {
    var e = ev || event;
    var nodeName = JSEvents.getNodeNameForTarget(e.target);
    var id = e.target.id ? e.target.id : "";
    var focusEvent = JSEvents.focusEvent;
    stringToUTF8(nodeName, focusEvent + 0, 128);
    stringToUTF8(id, focusEvent + 128, 128);
    if (getWasmTableEntry(callbackfunc)(eventTypeId, focusEvent, userData)) {
      e.preventDefault();
    }
  };
  var eventHandler = {target:findEventTarget(target), eventTypeString:eventTypeString, callbackfunc:callbackfunc, handlerFunc:focusEventHandlerFunc, useCapture:useCapture};
  JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_blur_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, "blur", targetThread);
  return 0;
}
function _emscripten_set_element_css_size(target, width, height) {
  target = findEventTarget(target);
  if (!target) {
    return -4;
  }
  target.style.width = width + "px";
  target.style.height = height + "px";
  return 0;
}
function _emscripten_set_focus_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, "focus", targetThread);
  return 0;
}
function registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  if (!JSEvents.fullscreenChangeEvent) {
    JSEvents.fullscreenChangeEvent = _malloc(280);
  }
  var fullscreenChangeEventhandlerFunc = function(ev) {
    var e = ev || event;
    var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
    fillFullscreenChangeEventData(fullscreenChangeEvent);
    if (getWasmTableEntry(callbackfunc)(eventTypeId, fullscreenChangeEvent, userData)) {
      e.preventDefault();
    }
  };
  var eventHandler = {target:target, eventTypeString:eventTypeString, callbackfunc:callbackfunc, handlerFunc:fullscreenChangeEventhandlerFunc, useCapture:useCapture};
  JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (!JSEvents.fullscreenEnabled()) {
    return -1;
  }
  target = findEventTarget(target);
  if (!target) {
    return -4;
  }
  registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread);
  registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "mozfullscreenchange", targetThread);
  registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
  registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "MSFullscreenChange", targetThread);
  return 0;
}
function registerKeyEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  if (!JSEvents.keyEvent) {
    JSEvents.keyEvent = _malloc(176);
  }
  var keyEventHandlerFunc = function(e) {
    var keyEventData = JSEvents.keyEvent;
    HEAPF64[keyEventData >> 3] = e.timeStamp;
    var idx = keyEventData >> 2;
    HEAP32[idx + 2] = e.location;
    HEAP32[idx + 3] = e.ctrlKey;
    HEAP32[idx + 4] = e.shiftKey;
    HEAP32[idx + 5] = e.altKey;
    HEAP32[idx + 6] = e.metaKey;
    HEAP32[idx + 7] = e.repeat;
    HEAP32[idx + 8] = e.charCode;
    HEAP32[idx + 9] = e.keyCode;
    HEAP32[idx + 10] = e.which;
    stringToUTF8(e.key || "", keyEventData + 44, 32);
    stringToUTF8(e.code || "", keyEventData + 76, 32);
    stringToUTF8(e.char || "", keyEventData + 108, 32);
    stringToUTF8(e.locale || "", keyEventData + 140, 32);
    if (getWasmTableEntry(callbackfunc)(eventTypeId, keyEventData, userData)) {
      e.preventDefault();
    }
  };
  var eventHandler = {target:findEventTarget(target), allowsDeferredCalls:JSEvents.isInternetExplorer() ? false : true, eventTypeString:eventTypeString, callbackfunc:callbackfunc, handlerFunc:keyEventHandlerFunc, useCapture:useCapture};
  JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
  return 0;
}
function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);
  return 0;
}
function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
  return 0;
}
function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop) {
  var browserIterationFunc = getWasmTableEntry(func);
  setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop);
}
function fillMouseEventData(eventStruct, e, target) {
  HEAPF64[eventStruct >> 3] = e.timeStamp;
  var idx = eventStruct >> 2;
  HEAP32[idx + 2] = e.screenX;
  HEAP32[idx + 3] = e.screenY;
  HEAP32[idx + 4] = e.clientX;
  HEAP32[idx + 5] = e.clientY;
  HEAP32[idx + 6] = e.ctrlKey;
  HEAP32[idx + 7] = e.shiftKey;
  HEAP32[idx + 8] = e.altKey;
  HEAP32[idx + 9] = e.metaKey;
  HEAP16[idx * 2 + 20] = e.button;
  HEAP16[idx * 2 + 21] = e.buttons;
  HEAP32[idx + 11] = e["movementX"] || e["mozMovementX"] || e["webkitMovementX"] || e.screenX - JSEvents.previousScreenX;
  HEAP32[idx + 12] = e["movementY"] || e["mozMovementY"] || e["webkitMovementY"] || e.screenY - JSEvents.previousScreenY;
  var rect = getBoundingClientRect(target);
  HEAP32[idx + 13] = e.clientX - rect.left;
  HEAP32[idx + 14] = e.clientY - rect.top;
  if (e.type !== "wheel") {
    JSEvents.previousScreenX = e.screenX;
    JSEvents.previousScreenY = e.screenY;
  }
}
function registerMouseEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  if (!JSEvents.mouseEvent) {
    JSEvents.mouseEvent = _malloc(72);
  }
  target = findEventTarget(target);
  var mouseEventHandlerFunc = function(ev) {
    var e = ev || event;
    fillMouseEventData(JSEvents.mouseEvent, e, target);
    if (getWasmTableEntry(callbackfunc)(eventTypeId, JSEvents.mouseEvent, userData)) {
      e.preventDefault();
    }
  };
  var eventHandler = {target:target, allowsDeferredCalls:eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave", eventTypeString:eventTypeString, callbackfunc:callbackfunc, handlerFunc:mouseEventHandlerFunc, useCapture:useCapture};
  if (JSEvents.isInternetExplorer() && eventTypeString == "mousedown") {
    eventHandler.allowsDeferredCalls = false;
  }
  JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
  return 0;
}
function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
  return 0;
}
function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
  return 0;
}
function registerUiEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  if (!JSEvents.uiEvent) {
    JSEvents.uiEvent = _malloc(36);
  }
  target = findEventTarget(target);
  var uiEventHandlerFunc = function(ev) {
    var e = ev || event;
    if (e.target != target) {
      return;
    }
    var b = document.body;
    if (!b) {
      return;
    }
    var uiEvent = JSEvents.uiEvent;
    HEAP32[uiEvent >> 2] = e.detail;
    HEAP32[uiEvent + 4 >> 2] = b.clientWidth;
    HEAP32[uiEvent + 8 >> 2] = b.clientHeight;
    HEAP32[uiEvent + 12 >> 2] = innerWidth;
    HEAP32[uiEvent + 16 >> 2] = innerHeight;
    HEAP32[uiEvent + 20 >> 2] = outerWidth;
    HEAP32[uiEvent + 24 >> 2] = outerHeight;
    HEAP32[uiEvent + 28 >> 2] = pageXOffset;
    HEAP32[uiEvent + 32 >> 2] = pageYOffset;
    if (getWasmTableEntry(callbackfunc)(eventTypeId, uiEvent, userData)) {
      e.preventDefault();
    }
  };
  var eventHandler = {target:target, eventTypeString:eventTypeString, callbackfunc:callbackfunc, handlerFunc:uiEventHandlerFunc, useCapture:useCapture};
  JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_resize_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, "resize", targetThread);
  return 0;
}
function registerTouchEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  if (!JSEvents.touchEvent) {
    JSEvents.touchEvent = _malloc(1696);
  }
  target = findEventTarget(target);
  var touchEventHandlerFunc = function(e) {
    var t, touches = {}, et = e.touches;
    for (var i = 0; i < et.length; ++i) {
      t = et[i];
      t.isChanged = t.onTarget = 0;
      touches[t.identifier] = t;
    }
    for (var i = 0; i < e.changedTouches.length; ++i) {
      t = e.changedTouches[i];
      t.isChanged = 1;
      touches[t.identifier] = t;
    }
    for (var i = 0; i < e.targetTouches.length; ++i) {
      touches[e.targetTouches[i].identifier].onTarget = 1;
    }
    var touchEvent = JSEvents.touchEvent;
    HEAPF64[touchEvent >> 3] = e.timeStamp;
    var idx = touchEvent >> 2;
    HEAP32[idx + 3] = e.ctrlKey;
    HEAP32[idx + 4] = e.shiftKey;
    HEAP32[idx + 5] = e.altKey;
    HEAP32[idx + 6] = e.metaKey;
    idx += 7;
    var targetRect = getBoundingClientRect(target);
    var numTouches = 0;
    for (var i in touches) {
      t = touches[i];
      HEAP32[idx + 0] = t.identifier;
      HEAP32[idx + 1] = t.screenX;
      HEAP32[idx + 2] = t.screenY;
      HEAP32[idx + 3] = t.clientX;
      HEAP32[idx + 4] = t.clientY;
      HEAP32[idx + 5] = t.pageX;
      HEAP32[idx + 6] = t.pageY;
      HEAP32[idx + 7] = t.isChanged;
      HEAP32[idx + 8] = t.onTarget;
      HEAP32[idx + 9] = t.clientX - targetRect.left;
      HEAP32[idx + 10] = t.clientY - targetRect.top;
      idx += 13;
      if (++numTouches > 31) {
        break;
      }
    }
    HEAP32[touchEvent + 8 >> 2] = numTouches;
    if (getWasmTableEntry(callbackfunc)(eventTypeId, touchEvent, userData)) {
      e.preventDefault();
    }
  };
  var eventHandler = {target:target, allowsDeferredCalls:eventTypeString == "touchstart" || eventTypeString == "touchend", eventTypeString:eventTypeString, callbackfunc:callbackfunc, handlerFunc:touchEventHandlerFunc, useCapture:useCapture};
  JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
  return 0;
}
function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
  return 0;
}
function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
  return 0;
}
function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
  return 0;
}
function fillVisibilityChangeEventData(eventStruct) {
  var visibilityStates = ["hidden", "visible", "prerender", "unloaded"];
  var visibilityState = visibilityStates.indexOf(document.visibilityState);
  HEAP32[eventStruct >> 2] = document.hidden;
  HEAP32[eventStruct + 4 >> 2] = visibilityState;
}
function registerVisibilityChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  if (!JSEvents.visibilityChangeEvent) {
    JSEvents.visibilityChangeEvent = _malloc(8);
  }
  var visibilityChangeEventHandlerFunc = function(ev) {
    var e = ev || event;
    var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
    fillVisibilityChangeEventData(visibilityChangeEvent);
    if (getWasmTableEntry(callbackfunc)(eventTypeId, visibilityChangeEvent, userData)) {
      e.preventDefault();
    }
  };
  var eventHandler = {target:target, eventTypeString:eventTypeString, callbackfunc:callbackfunc, handlerFunc:visibilityChangeEventHandlerFunc, useCapture:useCapture};
  JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_visibilitychange_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
  if (!specialHTMLTargets[1]) {
    return -4;
  }
  registerVisibilityChangeEventCallback(specialHTMLTargets[1], userData, useCapture, callbackfunc, 21, "visibilitychange", targetThread);
  return 0;
}
function __registerWebGlEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  var webGlEventHandlerFunc = function(ev) {
    var e = ev || event;
    if (getWasmTableEntry(callbackfunc)(eventTypeId, 0, userData)) {
      e.preventDefault();
    }
  };
  var eventHandler = {target:findEventTarget(target), eventTypeString:eventTypeString, callbackfunc:callbackfunc, handlerFunc:webGlEventHandlerFunc, useCapture:useCapture};
  JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_webglcontextlost_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  __registerWebGlEventCallback(target, userData, useCapture, callbackfunc, 31, "webglcontextlost", targetThread);
  return 0;
}
function registerWheelEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  if (!JSEvents.wheelEvent) {
    JSEvents.wheelEvent = _malloc(104);
  }
  var wheelHandlerFunc = function(ev) {
    var e = ev || event;
    var wheelEvent = JSEvents.wheelEvent;
    fillMouseEventData(wheelEvent, e, target);
    HEAPF64[wheelEvent + 72 >> 3] = e["deltaX"];
    HEAPF64[wheelEvent + 80 >> 3] = e["deltaY"];
    HEAPF64[wheelEvent + 88 >> 3] = e["deltaZ"];
    HEAP32[wheelEvent + 96 >> 2] = e["deltaMode"];
    if (getWasmTableEntry(callbackfunc)(eventTypeId, wheelEvent, userData)) {
      e.preventDefault();
    }
  };
  var mouseWheelHandlerFunc = function(ev) {
    var e = ev || event;
    fillMouseEventData(JSEvents.wheelEvent, e, target);
    HEAPF64[JSEvents.wheelEvent + 72 >> 3] = e["wheelDeltaX"] || 0;
    var wheelDeltaY = -(e["wheelDeltaY"] || e["wheelDelta"]);
    HEAPF64[JSEvents.wheelEvent + 80 >> 3] = wheelDeltaY;
    HEAPF64[JSEvents.wheelEvent + 88 >> 3] = 0;
    HEAP32[JSEvents.wheelEvent + 96 >> 2] = 0;
    var shouldCancel = getWasmTableEntry(callbackfunc)(eventTypeId, JSEvents.wheelEvent, userData);
    if (shouldCancel) {
      e.preventDefault();
    }
  };
  var eventHandler = {target:target, allowsDeferredCalls:true, eventTypeString:eventTypeString, callbackfunc:callbackfunc, handlerFunc:eventTypeString == "wheel" ? wheelHandlerFunc : mouseWheelHandlerFunc, useCapture:useCapture};
  JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  target = findEventTarget(target);
  if (typeof target.onwheel != "undefined") {
    registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
    return 0;
  } else if (typeof target.onmousewheel != "undefined") {
    registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "mousewheel", targetThread);
    return 0;
  } else {
    return -1;
  }
}
function __webgl_enable_ANGLE_instanced_arrays(ctx) {
  var ext = ctx.getExtension("ANGLE_instanced_arrays");
  if (ext) {
    ctx["vertexAttribDivisor"] = function(index, divisor) {
      ext["vertexAttribDivisorANGLE"](index, divisor);
    };
    ctx["drawArraysInstanced"] = function(mode, first, count, primcount) {
      ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
    };
    ctx["drawElementsInstanced"] = function(mode, count, type, indices, primcount) {
      ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
    };
    return 1;
  }
}
function __webgl_enable_OES_vertex_array_object(ctx) {
  var ext = ctx.getExtension("OES_vertex_array_object");
  if (ext) {
    ctx["createVertexArray"] = function() {
      return ext["createVertexArrayOES"]();
    };
    ctx["deleteVertexArray"] = function(vao) {
      ext["deleteVertexArrayOES"](vao);
    };
    ctx["bindVertexArray"] = function(vao) {
      ext["bindVertexArrayOES"](vao);
    };
    ctx["isVertexArray"] = function(vao) {
      return ext["isVertexArrayOES"](vao);
    };
    return 1;
  }
}
function __webgl_enable_WEBGL_draw_buffers(ctx) {
  var ext = ctx.getExtension("WEBGL_draw_buffers");
  if (ext) {
    ctx["drawBuffers"] = function(n, bufs) {
      ext["drawBuffersWEBGL"](n, bufs);
    };
    return 1;
  }
}
function __webgl_enable_WEBGL_multi_draw(ctx) {
  return !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));
}
var GL = {counter:1, buffers:[], programs:[], framebuffers:[], renderbuffers:[], textures:[], shaders:[], vaos:[], contexts:[], offscreenCanvases:{}, queries:[], stringCache:{}, unpackAlignment:4, recordError:function recordError(errorCode) {
  if (!GL.lastError) {
    GL.lastError = errorCode;
  }
}, getNewId:function(table) {
  var ret = GL.counter++;
  for (var i = table.length; i < ret; i++) {
    table[i] = null;
  }
  return ret;
}, getSource:function(shader, count, string, length) {
  var source = "";
  for (var i = 0; i < count; ++i) {
    var len = length ? HEAP32[length + i * 4 >> 2] : -1;
    source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined : len);
  }
  return source;
}, createContext:function(canvas, webGLContextAttributes) {
  if (!canvas.getContextSafariWebGL2Fixed) {
    var fixedGetContext = function(ver, attrs) {
      var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
      return ver == "webgl" == gl instanceof WebGLRenderingContext ? gl : null;
    };
    canvas.getContextSafariWebGL2Fixed = canvas.getContext;
    canvas.getContext = fixedGetContext;
  }
  var ctx = canvas.getContext("webgl", webGLContextAttributes) || canvas.getContext("experimental-webgl", webGLContextAttributes);
  if (!ctx) {
    return 0;
  }
  var handle = GL.registerContext(ctx, webGLContextAttributes);
  return handle;
}, registerContext:function(ctx, webGLContextAttributes) {
  var handle = GL.getNewId(GL.contexts);
  var context = {handle:handle, attributes:webGLContextAttributes, version:webGLContextAttributes.majorVersion, GLctx:ctx};
  if (ctx.canvas) {
    ctx.canvas.GLctxObject = context;
  }
  GL.contexts[handle] = context;
  if (typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
    GL.initExtensions(context);
  }
  return handle;
}, makeContextCurrent:function(contextHandle) {
  GL.currentContext = GL.contexts[contextHandle];
  Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
  return !(contextHandle && !GLctx);
}, getContext:function(contextHandle) {
  return GL.contexts[contextHandle];
}, deleteContext:function(contextHandle) {
  if (GL.currentContext === GL.contexts[contextHandle]) {
    GL.currentContext = null;
  }
  if (typeof JSEvents == "object") {
    JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
  }
  if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) {
    GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
  }
  GL.contexts[contextHandle] = null;
}, initExtensions:function(context) {
  if (!context) {
    context = GL.currentContext;
  }
  if (context.initExtensionsDone) {
    return;
  }
  context.initExtensionsDone = true;
  var GLctx = context.GLctx;
  __webgl_enable_ANGLE_instanced_arrays(GLctx);
  __webgl_enable_OES_vertex_array_object(GLctx);
  __webgl_enable_WEBGL_draw_buffers(GLctx);
  {
    GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
  }
  __webgl_enable_WEBGL_multi_draw(GLctx);
  var exts = GLctx.getSupportedExtensions() || [];
  exts.forEach(function(ext) {
    if (!ext.includes("lose_context") && !ext.includes("debug")) {
      GLctx.getExtension(ext);
    }
  });
}};
var __emscripten_webgl_power_preferences = ["default", "low-power", "high-performance"];
function _emscripten_webgl_do_create_context(target, attributes) {
  var a = attributes >> 2;
  var powerPreference = HEAP32[a + (24 >> 2)];
  var contextAttributes = {"alpha":!!HEAP32[a + (0 >> 2)], "depth":!!HEAP32[a + (4 >> 2)], "stencil":!!HEAP32[a + (8 >> 2)], "antialias":!!HEAP32[a + (12 >> 2)], "premultipliedAlpha":!!HEAP32[a + (16 >> 2)], "preserveDrawingBuffer":!!HEAP32[a + (20 >> 2)], "powerPreference":__emscripten_webgl_power_preferences[powerPreference], "failIfMajorPerformanceCaveat":!!HEAP32[a + (28 >> 2)], majorVersion:HEAP32[a + (32 >> 2)], minorVersion:HEAP32[a + (36 >> 2)], enableExtensionsByDefault:HEAP32[a + (40 >> 
  2)], explicitSwapControl:HEAP32[a + (44 >> 2)], proxyContextToMainThread:HEAP32[a + (48 >> 2)], renderViaOffscreenBackBuffer:HEAP32[a + (52 >> 2)]};
  var canvas = findCanvasEventTarget(target);
  if (!canvas) {
    return 0;
  }
  if (contextAttributes.explicitSwapControl) {
    return 0;
  }
  var contextHandle = GL.createContext(canvas, contextAttributes);
  return contextHandle;
}
var _emscripten_webgl_create_context = _emscripten_webgl_do_create_context;
function _emscripten_webgl_destroy_context(contextHandle) {
  if (GL.currentContext == contextHandle) {
    GL.currentContext = 0;
  }
  GL.deleteContext(contextHandle);
}
function _emscripten_webgl_init_context_attributes(attributes) {
  var a = attributes >> 2;
  for (var i = 0; i < 56 >> 2; ++i) {
    HEAP32[a + i] = 0;
  }
  HEAP32[a + (0 >> 2)] = HEAP32[a + (4 >> 2)] = HEAP32[a + (12 >> 2)] = HEAP32[a + (16 >> 2)] = HEAP32[a + (32 >> 2)] = HEAP32[a + (40 >> 2)] = 1;
}
function _emscripten_webgl_make_context_current(contextHandle) {
  var success = GL.makeContextCurrent(contextHandle);
  return success ? 0 : -5;
}
function _glAttachShader(program, shader) {
  GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
}
function _glBindAttribLocation(program, index, name) {
  GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
}
function _glBindBuffer(target, buffer) {
  GLctx.bindBuffer(target, GL.buffers[buffer]);
}
function _glBindTexture(target, texture) {
  GLctx.bindTexture(target, GL.textures[texture]);
}
function _glBlendFunc(x0, x1) {
  GLctx["blendFunc"](x0, x1);
}
function _glBufferData(target, size, data, usage) {
  GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage);
}
function _glBufferSubData(target, offset, size, data) {
  GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size));
}
function _glClear(x0) {
  GLctx["clear"](x0);
}
function _glClearColor(x0, x1, x2, x3) {
  GLctx["clearColor"](x0, x1, x2, x3);
}
function _glColorMask(red, green, blue, alpha) {
  GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
}
function _glCompileShader(shader) {
  GLctx.compileShader(GL.shaders[shader]);
}
function _glCreateProgram() {
  var id = GL.getNewId(GL.programs);
  var program = GLctx.createProgram();
  program.name = id;
  program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
  program.uniformIdCounter = 1;
  GL.programs[id] = program;
  return id;
}
function _glCreateShader(shaderType) {
  var id = GL.getNewId(GL.shaders);
  GL.shaders[id] = GLctx.createShader(shaderType);
  return id;
}
function _glDeleteBuffers(n, buffers) {
  for (var i = 0; i < n; i++) {
    var id = HEAP32[buffers + i * 4 >> 2];
    var buffer = GL.buffers[id];
    if (!buffer) {
      continue;
    }
    GLctx.deleteBuffer(buffer);
    buffer.name = 0;
    GL.buffers[id] = null;
  }
}
function _glDeleteProgram(id) {
  if (!id) {
    return;
  }
  var program = GL.programs[id];
  if (!program) {
    GL.recordError(1281);
    return;
  }
  GLctx.deleteProgram(program);
  program.name = 0;
  GL.programs[id] = null;
}
function _glDeleteShader(id) {
  if (!id) {
    return;
  }
  var shader = GL.shaders[id];
  if (!shader) {
    GL.recordError(1281);
    return;
  }
  GLctx.deleteShader(shader);
  GL.shaders[id] = null;
}
function _glDeleteTextures(n, textures) {
  for (var i = 0; i < n; i++) {
    var id = HEAP32[textures + i * 4 >> 2];
    var texture = GL.textures[id];
    if (!texture) {
      continue;
    }
    GLctx.deleteTexture(texture);
    texture.name = 0;
    GL.textures[id] = null;
  }
}
function _glDepthFunc(x0) {
  GLctx["depthFunc"](x0);
}
function _glDepthMask(flag) {
  GLctx.depthMask(!!flag);
}
function _glDetachShader(program, shader) {
  GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
}
function _glDisable(x0) {
  GLctx["disable"](x0);
}
function _glDisableVertexAttribArray(index) {
  GLctx.disableVertexAttribArray(index);
}
function _glDrawArrays(mode, first, count) {
  GLctx.drawArrays(mode, first, count);
}
function _glDrawElements(mode, count, type, indices) {
  GLctx.drawElements(mode, count, type, indices);
}
function _glEnable(x0) {
  GLctx["enable"](x0);
}
function _glEnableVertexAttribArray(index) {
  GLctx.enableVertexAttribArray(index);
}
function __glGenObject(n, buffers, createFunction, objectTable) {
  for (var i = 0; i < n; i++) {
    var buffer = GLctx[createFunction]();
    var id = buffer && GL.getNewId(objectTable);
    if (buffer) {
      buffer.name = id;
      objectTable[id] = buffer;
    } else {
      GL.recordError(1282);
    }
    HEAP32[buffers + i * 4 >> 2] = id;
  }
}
function _glGenBuffers(n, buffers) {
  __glGenObject(n, buffers, "createBuffer", GL.buffers);
}
function _glGenTextures(n, textures) {
  __glGenObject(n, textures, "createTexture", GL.textures);
}
function writeI53ToI64(ptr, num) {
  HEAPU32[ptr >> 2] = num;
  HEAPU32[ptr + 4 >> 2] = (num - HEAPU32[ptr >> 2]) / 4294967296;
}
function emscriptenWebGLGet(name_, p, type) {
  if (!p) {
    GL.recordError(1281);
    return;
  }
  var ret = undefined;
  switch(name_) {
    case 36346:
      ret = 1;
      break;
    case 36344:
      if (type != 0 && type != 1) {
        GL.recordError(1280);
      }
      return;
    case 36345:
      ret = 0;
      break;
    case 34466:
      var formats = GLctx.getParameter(34467);
      ret = formats ? formats.length : 0;
      break;
  }
  if (ret === undefined) {
    var result = GLctx.getParameter(name_);
    switch(typeof result) {
      case "number":
        ret = result;
        break;
      case "boolean":
        ret = result ? 1 : 0;
        break;
      case "string":
        GL.recordError(1280);
        return;
      case "object":
        if (result === null) {
          switch(name_) {
            case 34964:
            case 35725:
            case 34965:
            case 36006:
            case 36007:
            case 32873:
            case 34229:
            case 34068:
              {
                ret = 0;
                break;
              }
            default:
              {
                GL.recordError(1280);
                return;
              }
          }
        } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
          for (var i = 0; i < result.length; ++i) {
            switch(type) {
              case 0:
                HEAP32[p + i * 4 >> 2] = result[i];
                break;
              case 2:
                HEAPF32[p + i * 4 >> 2] = result[i];
                break;
              case 4:
                HEAP8[p + i >> 0] = result[i] ? 1 : 0;
                break;
            }
          }
          return;
        } else {
          try {
            ret = result.name | 0;
          } catch (e) {
            GL.recordError(1280);
            err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
            return;
          }
        }
        break;
      default:
        GL.recordError(1280);
        err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
        return;
    }
  }
  switch(type) {
    case 1:
      writeI53ToI64(p, ret);
      break;
    case 0:
      HEAP32[p >> 2] = ret;
      break;
    case 2:
      HEAPF32[p >> 2] = ret;
      break;
    case 4:
      HEAP8[p >> 0] = ret ? 1 : 0;
      break;
  }
}
function _glGetIntegerv(name_, p) {
  emscriptenWebGLGet(name_, p, 0);
}
function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
  var log = GLctx.getProgramInfoLog(GL.programs[program]);
  if (log === null) {
    log = "(unknown error)";
  }
  var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
  if (length) {
    HEAP32[length >> 2] = numBytesWrittenExclNull;
  }
}
function _glGetProgramiv(program, pname, p) {
  if (!p) {
    GL.recordError(1281);
    return;
  }
  if (program >= GL.counter) {
    GL.recordError(1281);
    return;
  }
  program = GL.programs[program];
  if (pname == 35716) {
    var log = GLctx.getProgramInfoLog(program);
    if (log === null) {
      log = "(unknown error)";
    }
    HEAP32[p >> 2] = log.length + 1;
  } else if (pname == 35719) {
    if (!program.maxUniformLength) {
      for (var i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
        program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1);
      }
    }
    HEAP32[p >> 2] = program.maxUniformLength;
  } else if (pname == 35722) {
    if (!program.maxAttributeLength) {
      for (var i = 0; i < GLctx.getProgramParameter(program, 35721); ++i) {
        program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1);
      }
    }
    HEAP32[p >> 2] = program.maxAttributeLength;
  } else if (pname == 35381) {
    if (!program.maxUniformBlockNameLength) {
      for (var i = 0; i < GLctx.getProgramParameter(program, 35382); ++i) {
        program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1);
      }
    }
    HEAP32[p >> 2] = program.maxUniformBlockNameLength;
  } else {
    HEAP32[p >> 2] = GLctx.getProgramParameter(program, pname);
  }
}
function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
  if (log === null) {
    log = "(unknown error)";
  }
  var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
  if (length) {
    HEAP32[length >> 2] = numBytesWrittenExclNull;
  }
}
function _glGetShaderiv(shader, pname, p) {
  if (!p) {
    GL.recordError(1281);
    return;
  }
  if (pname == 35716) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) {
      log = "(unknown error)";
    }
    var logLength = log ? log.length + 1 : 0;
    HEAP32[p >> 2] = logLength;
  } else if (pname == 35720) {
    var source = GLctx.getShaderSource(GL.shaders[shader]);
    var sourceLength = source ? source.length + 1 : 0;
    HEAP32[p >> 2] = sourceLength;
  } else {
    HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
  }
}
function stringToNewUTF8(jsString) {
  var length = lengthBytesUTF8(jsString) + 1;
  var cString = _malloc(length);
  stringToUTF8(jsString, cString, length);
  return cString;
}
function _glGetString(name_) {
  var ret = GL.stringCache[name_];
  if (!ret) {
    switch(name_) {
      case 7939:
        var exts = GLctx.getSupportedExtensions() || [];
        exts = exts.concat(exts.map(function(e) {
          return "GL_" + e;
        }));
        ret = stringToNewUTF8(exts.join(" "));
        break;
      case 7936:
      case 7937:
      case 37445:
      case 37446:
        var s = GLctx.getParameter(name_);
        if (!s) {
          GL.recordError(1280);
        }
        ret = s && stringToNewUTF8(s);
        break;
      case 7938:
        var glVersion = GLctx.getParameter(7938);
        {
          glVersion = "OpenGL ES 2.0 (" + glVersion + ")";
        }
        ret = stringToNewUTF8(glVersion);
        break;
      case 35724:
        var glslVersion = GLctx.getParameter(35724);
        var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
        var ver_num = glslVersion.match(ver_re);
        if (ver_num !== null) {
          if (ver_num[1].length == 3) {
            ver_num[1] = ver_num[1] + "0";
          }
          glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")";
        }
        ret = stringToNewUTF8(glslVersion);
        break;
      default:
        GL.recordError(1280);
    }
    GL.stringCache[name_] = ret;
  }
  return ret;
}
function jstoi_q(str) {
  return parseInt(str);
}
function webglGetLeftBracePos(name) {
  return name.slice(-1) == "]" && name.lastIndexOf("[");
}
function webglPrepareUniformLocationsBeforeFirstUse(program) {
  var uniformLocsById = program.uniformLocsById, uniformSizeAndIdsByName = program.uniformSizeAndIdsByName, i, j;
  if (!uniformLocsById) {
    program.uniformLocsById = uniformLocsById = {};
    program.uniformArrayNamesById = {};
    for (i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
      var u = GLctx.getActiveUniform(program, i);
      var nm = u.name;
      var sz = u.size;
      var lb = webglGetLeftBracePos(nm);
      var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
      var id = program.uniformIdCounter;
      program.uniformIdCounter += sz;
      uniformSizeAndIdsByName[arrayName] = [sz, id];
      for (j = 0; j < sz; ++j) {
        uniformLocsById[id] = j;
        program.uniformArrayNamesById[id++] = arrayName;
      }
    }
  }
}
function _glGetUniformLocation(program, name) {
  name = UTF8ToString(name);
  if (program = GL.programs[program]) {
    webglPrepareUniformLocationsBeforeFirstUse(program);
    var uniformLocsById = program.uniformLocsById;
    var arrayIndex = 0;
    var uniformBaseName = name;
    var leftBrace = webglGetLeftBracePos(name);
    if (leftBrace > 0) {
      arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
      uniformBaseName = name.slice(0, leftBrace);
    }
    var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
    if (sizeAndId && arrayIndex < sizeAndId[0]) {
      arrayIndex += sizeAndId[1];
      if (uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name)) {
        return arrayIndex;
      }
    }
  } else {
    GL.recordError(1281);
  }
  return -1;
}
function _glLinkProgram(program) {
  program = GL.programs[program];
  GLctx.linkProgram(program);
  program.uniformLocsById = 0;
  program.uniformSizeAndIdsByName = {};
}
function _glShaderSource(shader, count, string, length) {
  var source = GL.getSource(shader, count, string, length);
  GLctx.shaderSource(GL.shaders[shader], source);
}
function computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
  function roundedToNextMultipleOf(x, y) {
    return x + y - 1 & -y;
  }
  var plainRowSize = width * sizePerPixel;
  var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
  return height * alignedRowSize;
}
function __colorChannelsInGlTextureFormat(format) {
  var colorChannels = {5:3, 6:4, 8:2, 29502:3, 29504:4,};
  return colorChannels[format - 6402] || 1;
}
function heapObjectForWebGLType(type) {
  type -= 5120;
  if (type == 1) {
    return HEAPU8;
  }
  if (type == 4) {
    return HEAP32;
  }
  if (type == 6) {
    return HEAPF32;
  }
  if (type == 5 || type == 28922) {
    return HEAPU32;
  }
  return HEAPU16;
}
function heapAccessShiftForWebGLHeap(heap) {
  return 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
}
function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
  var heap = heapObjectForWebGLType(type);
  var shift = heapAccessShiftForWebGLHeap(heap);
  var byteSize = 1 << shift;
  var sizePerPixel = __colorChannelsInGlTextureFormat(format) * byteSize;
  var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
  return heap.subarray(pixels >> shift, pixels + bytes >> shift);
}
function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
  GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null);
}
function _glTexParameteri(x0, x1, x2) {
  GLctx["texParameteri"](x0, x1, x2);
}
function _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
  var pixelData = null;
  if (pixels) {
    pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
  }
  GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
}
function webglGetUniformLocation(location) {
  var p = GLctx.currentProgram;
  if (p) {
    var webglLoc = p.uniformLocsById[location];
    if (typeof webglLoc == "number") {
      p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? "[" + webglLoc + "]" : ""));
    }
    return webglLoc;
  } else {
    GL.recordError(1282);
  }
}
function _glUniform1f(location, v0) {
  GLctx.uniform1f(webglGetUniformLocation(location), v0);
}
function _glUniform2f(location, v0, v1) {
  GLctx.uniform2f(webglGetUniformLocation(location), v0, v1);
}
function _glUniform3f(location, v0, v1, v2) {
  GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2);
}
var miniTempWebGLFloatBuffers = [];
function _glUniformMatrix4fv(location, count, transpose, value) {
  if (count <= 18) {
    var view = miniTempWebGLFloatBuffers[16 * count - 1];
    var heap = HEAPF32;
    value >>= 2;
    for (var i = 0; i < 16 * count; i += 16) {
      var dst = value + i;
      view[i] = heap[dst];
      view[i + 1] = heap[dst + 1];
      view[i + 2] = heap[dst + 2];
      view[i + 3] = heap[dst + 3];
      view[i + 4] = heap[dst + 4];
      view[i + 5] = heap[dst + 5];
      view[i + 6] = heap[dst + 6];
      view[i + 7] = heap[dst + 7];
      view[i + 8] = heap[dst + 8];
      view[i + 9] = heap[dst + 9];
      view[i + 10] = heap[dst + 10];
      view[i + 11] = heap[dst + 11];
      view[i + 12] = heap[dst + 12];
      view[i + 13] = heap[dst + 13];
      view[i + 14] = heap[dst + 14];
      view[i + 15] = heap[dst + 15];
    }
  } else {
    var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2);
  }
  GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view);
}
function _glUseProgram(program) {
  program = GL.programs[program];
  GLctx.useProgram(program);
  GLctx.currentProgram = program;
}
function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
  GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
}
function _glViewport(x0, x1, x2, x3) {
  GLctx["viewport"](x0, x1, x2, x3);
}
function _interop_AddClipboardListeners() {
  window.addEventListener("copy", function(e) {
    if (window.getSelection && window.getSelection().toString()) {
      return;
    }
    ccall("Window_RequestClipboardText", "void");
    if (!window.cc_copyText) {
      return;
    }
    if (e.clipboardData) {
      e.clipboardData.setData("text/plain", window.cc_copyText);
      e.preventDefault();
    }
    window.cc_copyText = null;
  });
  window.addEventListener("paste", function(e) {
    if (e.clipboardData) {
      var contents = e.clipboardData.getData("text/plain");
      ccall("Window_GotClipboardText", "void", ["string"], [contents]);
    }
  });
}
function _interop_AdjustXY(x, y) {
  var canvasRect = Module["canvas"].getBoundingClientRect();
  HEAP32[x >> 2] = HEAP32[x >> 2] - canvasRect.left;
  HEAP32[y >> 2] = HEAP32[y >> 2] - canvasRect.top;
}
function _interop_AsyncDownloadTexturePack(rawPath, rawUrl) {
  var path = UTF8ToString(rawPath);
  var url = UTF8ToString(rawUrl);
  Module.setStatus("Downloading textures.. (1/2)");
  Module.readAsync(url, function(buffer) {
    CCFS.writeFile(path, new Uint8Array(buffer));
    ccall("main_phase1", "void");
  }, function() {
    ccall("main_phase1", "void");
  });
}
function _IDBFS_getDB(callback) {
  var db = window.IDBFS_db;
  if (db) {
    return callback(null, db);
  }
  IDBFS_DB_VERSION = 21;
  IDBFS_DB_STORE_NAME = "FILE_DATA";
  var idb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  if (!idb) {
    return callback("IndexedDB unsupported");
  }
  var req;
  try {
    req = idb.open("/classicube", IDBFS_DB_VERSION);
  } catch (e) {
    return callback(e);
  }
  if (!req) {
    return callback("Unable to connect to IndexedDB");
  }
  req.onupgradeneeded = function(e) {
    var db = e.target.result;
    var transaction = e.target.transaction;
    var fileStore;
    if (db.objectStoreNames.contains(IDBFS_DB_STORE_NAME)) {
      fileStore = transaction.objectStore(IDBFS_DB_STORE_NAME);
    } else {
      fileStore = db.createObjectStore(IDBFS_DB_STORE_NAME);
    }
    if (!fileStore.indexNames.contains("timestamp")) {
      fileStore.createIndex("timestamp", "timestamp", {unique:false});
    }
  };
  req.onsuccess = function() {
    db = req.result;
    window.IDBFS_db = db;
    db.onclose = function(ev) {
      console.log("IndexedDB connection closed unexpectedly!");
      window.IDBFS_db = null;
    };
    callback(null, db);
  };
  req.onerror = function(e) {
    callback(this.error);
    e.preventDefault();
  };
}
function _IDBFS_getRemoteSet(callback) {
  var entries = {};
  _IDBFS_getDB(function(err, db) {
    if (err) {
      return callback(err);
    }
    try {
      var transaction = db.transaction([IDBFS_DB_STORE_NAME], "readonly");
      transaction.onerror = function(e) {
        callback(this.error);
        e.preventDefault();
      };
      var store = transaction.objectStore(IDBFS_DB_STORE_NAME);
      var index = store.index("timestamp");
      index.openKeyCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (!cursor) {
          return callback(null, {type:"remote", db:db, entries:entries});
        }
        entries[cursor.primaryKey] = {timestamp:cursor.key};
        cursor.continue();
      };
    } catch (e) {
      return callback(e);
    }
  });
}
function _IDBFS_loadRemoteEntry(store, path, callback) {
  var req = store.get(path);
  req.onsuccess = function(event) {
    callback(null, event.target.result);
  };
  req.onerror = function(e) {
    callback(this.error);
    e.preventDefault();
  };
}
function _IDBFS_storeLocalEntry(path, entry, callback) {
  try {
    if (CCFS.isFile(entry.mode)) {
      CCFS.writeFile(path, entry.contents);
      CCFS.utime(path, entry.timestamp);
    }
  } catch (e) {
    return callback(e);
  }
  callback(null);
}
function _IDBFS_reconcile(src, callback) {
  var total = 0;
  var create = [];
  Object.keys(src.entries).forEach(function(key) {
    create.push(key);
    total++;
  });
  if (!total) {
    return callback(null);
  }
  var errored = false;
  var completed = 0;
  var transaction = src.db.transaction([IDBFS_DB_STORE_NAME], "readwrite");
  var store = transaction.objectStore(IDBFS_DB_STORE_NAME);
  function done(err) {
    if (err) {
      if (!done.errored) {
        done.errored = true;
        return callback(err);
      }
      return;
    }
    if (++completed >= total) {
      return callback(null);
    }
  }
  transaction.onerror = function(e) {
    done(this.error);
    e.preventDefault();
  };
  create.sort().forEach(function(path) {
    _IDBFS_loadRemoteEntry(store, path, function(err, entry) {
      if (err) {
        return done(err);
      }
      _IDBFS_storeLocalEntry(path, entry, done);
    });
  });
}
function _IDBFS_loadFS(callback) {
  _IDBFS_getRemoteSet(function(err, remote) {
    if (err) {
      return callback(err);
    }
    _IDBFS_reconcile(remote, callback);
  });
}
function _interop_AsyncLoadIndexedDB() {
  Module.setStatus("Preloading filesystem.. (2/2)");
  _IDBFS_loadFS(function(err) {
    if (err) {
      window.cc_idbErr = err;
    }
    Module.setStatus("");
    ccall("main_phase2", "void");
  });
}
function _interop_AudioClose(ctxID) {
  var src = AUDIO.sources[ctxID - 1 | 0];
  if (src.source) {
    src.source.stop();
  }
  AUDIO.sources[ctxID - 1 | 0] = null;
}
function _interop_AudioCreate() {
  var src = {source:null, gain:null, playing:false,};
  AUDIO.sources.push(src);
  return AUDIO.sources.length | 0;
}
function _interop_AudioDescribe(errCode, buffer, bufferLen) {
  if (errCode > AUDIO.errors.length) {
    return 0;
  }
  var str = AUDIO.errors[errCode - 1];
  return stringToUTF8(str, buffer, bufferLen);
}
function _interop_AudioDownload(name) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/static/sounds/" + name + ".wav", true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function() {
    var data = xhr.response;
    AUDIO.context.decodeAudioData(data, function(buffer) {
      AUDIO.buffers[name] = buffer;
    });
  };
  xhr.send();
}
function _interop_AudioPlay(ctxID, sndID, volume, rate) {
  var src = AUDIO.sources[ctxID - 1 | 0];
  var name = UTF8ToString(sndID);
  if (!AUDIO.seen.hasOwnProperty(name)) {
    AUDIO.seen[name] = true;
    _interop_AudioDownload(name);
    return 0;
  }
  var buffer = AUDIO.buffers[name];
  if (!buffer) {
    return 0;
  }
  try {
    if (!src.gain) {
      src.gain = AUDIO.context.createGain();
    }
    src.source = AUDIO.context.createBufferSource();
    src.source.buffer = buffer;
    src.gain.gain.value = volume / 100;
    src.source.playbackRate.value = rate / 100;
    src.source.connect(src.gain);
    src.gain.connect(AUDIO.context.destination);
    src.source.start();
    return 0;
  } catch (err$6) {
    return _interop_AudioLog(err$6);
  }
}
function _interop_AudioPoll(ctxID, inUse) {
  var src = AUDIO.sources[ctxID - 1 | 0];
  HEAP32[inUse >> 2] = src.playing;
  return 0;
}
function _interop_CanvasHeight() {
  return Module["canvas"].height;
}
function _interop_CanvasWidth() {
  return Module["canvas"].width;
}
function _interop_CloseKeyboard() {
  if (!window.cc_inputElem) {
    return;
  }
  window.cc_container.removeChild(window.cc_divElem);
  window.cc_container.removeChild(window.cc_inputElem);
  window.cc_divElem = null;
  window.cc_inputElem = null;
}
function _interop_DirectoryIter(raw) {
  var path = UTF8ToString(raw);
  try {
    var entries = CCFS.readdir(path);
    for (var i = 0; i < entries.length; i++) {
      var path = entries[i];
      if (path.indexOf(CCFS.currentPath) === 0) {
        path = path.substring(CCFS.currentPath.length + 1);
      }
      ccall("Directory_IterCallback", "void", ["string"], [path]);
    }
    return 0;
  } catch (e) {
    if (!(e instanceof CCFS.ErrnoError)) {
      abort(e);
    }
    return -e.errno;
  }
}
function _interop_DirectorySetWorking(raw) {
  var path = UTF8ToString(raw);
  CCFS.chdir(path);
}
function _interop_DownloadAsync(urlStr, method, reqID) {
  var url = UTF8ToString(urlStr);
  var reqMethod = method == 1 ? "HEAD" : "GET";
  var onFinished = Module["_Http_OnFinishedAsync"];
  var onProgress = Module["_Http_OnUpdateProgress"];
  var xhr = new XMLHttpRequest();
  try {
    xhr.open(reqMethod, url);
  } catch (e) {
    console.log(e);
    return 1;
  }
  xhr.responseType = "arraybuffer";
  var getContentLength = function(e) {
    if (e.total) {
      return e.total;
    }
    try {
      var len = xhr.getResponseHeader("Content-Length");
      return parseInt(len, 10);
    } catch (ex) {
      return 0;
    }
  };
  xhr.onload = function(e) {
    var src = new Uint8Array(xhr.response);
    var len = src.byteLength;
    var data = _malloc(len);
    HEAPU8.set(src, data);
    onFinished(reqID, data, len || getContentLength(e), xhr.status);
  };
  xhr.onerror = function(e) {
    onFinished(reqID, 0, 0, xhr.status);
  };
  xhr.ontimeout = function(e) {
    onFinished(reqID, 0, 0, xhr.status);
  };
  xhr.onprogress = function(e) {
    onProgress(reqID, e.loaded, e.total);
  };
  try {
    xhr.send();
  } catch (e$7) {
    onFinished(reqID, 0, 0, 0);
  }
  return 0;
}
function _interop_SaveBlob(blob, name) {
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(blob, name);
    return;
  }
  var url = window.URL.createObjectURL(blob);
  var elem = document.createElement("a");
  elem.href = url;
  elem.download = name;
  elem.style.display = "none";
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
  window.URL.revokeObjectURL(url);
}
function _interop_ShowSaveDialog(filename, filters, titles) {
  if (!window.showSaveFilePicker) {
    return 0;
  }
  var fileTypes = [];
  for (var i = 0; HEAP32[(filters >> 2) + i | 0]; i++) {
    var filter = HEAP32[(filters >> 2) + i | 0];
    var title = HEAP32[(titles >> 2) + i | 0];
    var filetype = {description:UTF8ToString(title), accept:{"applicaion/octet-stream":[UTF8ToString(filter)]}};
    fileTypes.push(filetype);
  }
  var path = null;
  var opts = {suggestedName:UTF8ToString(filename), types:fileTypes};
  window.showSaveFilePicker(opts).then(function(fileHandle) {
    path = "Downloads/" + fileHandle.name;
    return fileHandle.createWritable();
  }).then(function(writable) {
    ccall("Window_OnFileUploaded", "void", ["string"], [path]);
    var data = CCFS.readFile(path);
    writable.write(data);
    return writable.close();
  }).catch(function(error) {
    ccall("Platform_LogError", "void", ["string"], ["&cError downloading file"]);
    ccall("Platform_LogError", "void", ["string"], ["   &c" + error]);
  }).finally(function(result) {
    if (path) {
      CCFS.unlink(path);
    }
  });
  return 1;
}
function _interop_DownloadFile(filename, filters, titles) {
  try {
    if (_interop_ShowSaveDialog(filename, filters, titles)) {
      return 0;
    }
    var name = UTF8ToString(filename);
    var path = "Downloads/" + name;
    ccall("Window_OnFileUploaded", "void", ["string"], [path]);
    var data = CCFS.readFile(path);
    var blob = new Blob([data], {type:"application/octet-stream"});
    _interop_SaveBlob(blob, UTF8ToString(filename));
    CCFS.unlink(path);
    return 0;
  } catch (e) {
    if (!(e instanceof CCFS.ErrnoError)) {
      abort(e);
    }
    return e.errno;
  }
}
function _interop_EnterFullscreen() {
  var canvas = Module["canvas"];
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  try {
    navigator.keyboard.lock(["Escape"]);
  } catch (ex) {
  }
}
function _interop_FS_Init() {
  if (window.CCFS) {
    return;
  }
  window.MEMFS = {createNode:function(path) {
    var node = CCFS.createNode(path);
    node.usedBytes = 0;
    node.contents = null;
    node.timestamp = Date.now();
    return node;
  }, getFileDataAsTypedArray:function(node) {
    if (!node.contents) {
      return new Uint8Array();
    }
    if (node.contents.subarray) {
      return node.contents.subarray(0, node.usedBytes);
    }
    return new Uint8Array(node.contents);
  }, expandFileStorage:function(node, newCapacity) {
    var prevCapacity = node.contents ? node.contents.length : 0;
    if (prevCapacity >= newCapacity) {
      return;
    }
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125) | 0);
    if (prevCapacity != 0) {
      newCapacity = Math.max(newCapacity, 256);
    }
    var oldContents = node.contents;
    node.contents = new Uint8Array(newCapacity);
    if (node.usedBytes > 0) {
      node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
    }
    return;
  }, clearFileStorage:function(node) {
    node.contents = null;
    node.usedBytes = 0;
  }, stream_read:function(stream, buffer, offset, length, position) {
    var contents = stream.node.contents;
    if (position >= stream.node.usedBytes) {
      return 0;
    }
    var size = Math.min(stream.node.usedBytes - position, length);
    assert(size >= 0);
    if (size > 8 && contents.subarray) {
      buffer.set(contents.subarray(position, position + size), offset);
    } else {
      for (var i = 0; i < size; i++) {
        buffer[offset + i] = contents[position + i];
      }
    }
    return size;
  }, stream_write:function(stream, buffer, offset, length, position, canOwn) {
    if (!length) {
      return 0;
    }
    var node = stream.node;
    var chunk = buffer.subarray(offset, offset + length);
    node.timestamp = Date.now();
    if (canOwn) {
      assert(position === 0, "canOwn must imply no weird position inside the file");
      node.contents = chunk;
      node.usedBytes = length;
    } else if (node.usedBytes === 0 && position === 0) {
      node.contents = new Uint8Array(chunk);
      node.usedBytes = length;
    } else if (position + length <= node.usedBytes) {
      node.contents.set(chunk, position);
    } else {
      MEMFS.expandFileStorage(node, position + length);
      node.contents.set(chunk, position);
      node.usedBytes = Math.max(node.usedBytes, position + length);
    }
    return length;
  }};
  window.CCFS = {streams:[], entries:{}, currentPath:"/", ErrnoError:null, resolvePath:function(path) {
    if (path.charAt(0) !== "/") {
      path = CCFS.currentPath + "/" + path;
    }
    return path;
  }, lookupPath:function(path) {
    path = CCFS.resolvePath(path);
    var node = CCFS.entries[path];
    if (!node) {
      throw new CCFS.ErrnoError(2);
    }
    return {path:path, node:node};
  }, createNode:function(path) {
    var node = {path:path};
    CCFS.entries[path] = node;
    return node;
  }, MODE_TYPE_FILE:32768, isFile:function(mode) {
    return (mode & 61440) === CCFS.MODE_TYPE_FILE;
  }, nextfd:function() {
    for (var fd = 0; fd <= 4096; fd++) {
      if (!CCFS.streams[fd]) {
        return fd;
      }
    }
    throw new CCFS.ErrnoError(24);
  }, getStream:function(fd) {
    return CCFS.streams[fd];
  }, createStream:function(stream) {
    var fd = CCFS.nextfd();
    stream.fd = fd;
    CCFS.streams[fd] = stream;
    return stream;
  }, readdir:function(path) {
    path = CCFS.resolvePath(path) + "/";
    var entries = [];
    for (var entry in CCFS.entries) {
      if (entry.indexOf(path) !== 0) {
        continue;
      }
      entries.push(entry);
    }
    return entries;
  }, unlink:function(path) {
    var lookup = CCFS.lookupPath(path);
    delete CCFS.entries[lookup.path];
  }, utime:function(path, mtime) {
    var lookup = CCFS.lookupPath(path);
    var node = lookup.node;
    node.timestamp = mtime;
  }, open:function(path, flags) {
    path = CCFS.resolvePath(path);
    var node = CCFS.entries[path];
    var created = false;
    if (flags & 64) {
      if (node) {
        if (flags & 128) {
          throw new CCFS.ErrnoError(17);
        }
      } else {
        node = MEMFS.createNode(path);
        created = true;
      }
    }
    if (!node) {
      throw new CCFS.ErrnoError(2);
    }
    if (flags & 512) {
      MEMFS.clearFileStorage(node);
      node.timestamp = Date.now();
    }
    flags &= ~(128 | 512);
    var stream = CCFS.createStream({node:node, path:path, flags:flags, position:0});
    return stream;
  }, close:function(stream) {
    if (CCFS.isClosed(stream)) {
      throw new CCFS.ErrnoError(9);
    }
    CCFS.streams[stream.fd] = null;
    stream.fd = null;
  }, isClosed:function(stream) {
    return stream.fd === null;
  }, llseek:function(stream, offset, whence) {
    if (CCFS.isClosed(stream)) {
      throw new CCFS.ErrnoError(9);
    }
    var position = offset;
    if (whence === 0) {
    } else if (whence === 1) {
      position += stream.position;
    } else if (whence === 2) {
      position += stream.node.usedBytes;
    }
    if (position < 0) {
      throw new CCFS.ErrnoError(22);
    }
    stream.position = position;
    return stream.position;
  }, read:function(stream, buffer, offset, length) {
    if (length < 0) {
      throw new CCFS.ErrnoError(22);
    }
    if (CCFS.isClosed(stream)) {
      throw new CCFS.ErrnoError(9);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new CCFS.ErrnoError(9);
    }
    var position = stream.position;
    var bytesRead = MEMFS.stream_read(stream, buffer, offset, length, position);
    stream.position += bytesRead;
    return bytesRead;
  }, write:function(stream, buffer, offset, length, canOwn) {
    if (length < 0) {
      throw new CCFS.ErrnoError(22);
    }
    if (CCFS.isClosed(stream)) {
      throw new CCFS.ErrnoError(9);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new CCFS.ErrnoError(9);
    }
    if (stream.flags & 1024) {
      CCFS.llseek(stream, 0, 2);
    }
    var position = stream.position;
    var bytesWritten = MEMFS.stream_write(stream, buffer, offset, length, position, canOwn);
    stream.position += bytesWritten;
    return bytesWritten;
  }, readFile:function(path, opts) {
    opts = opts || {};
    opts.encoding = opts.encoding || "binary";
    var ret;
    var stream = CCFS.open(path, 0);
    var length = stream.node.usedBytes;
    var buf = new Uint8Array(length);
    CCFS.read(stream, buf, 0, length);
    if (opts.encoding === "utf8") {
      ret = UTF8ArrayToString(buf, 0);
    } else if (opts.encoding === "binary") {
      ret = buf;
    } else {
      throw new Error('Invalid encoding type "' + opts.encoding + '"');
    }
    CCFS.close(stream);
    return ret;
  }, writeFile:function(path, data) {
    var stream = CCFS.open(path, 577);
    if (typeof data === "string") {
      var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
      var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
      CCFS.write(stream, buf, 0, actualNumBytes, true);
    } else if (ArrayBuffer.isView(data)) {
      CCFS.write(stream, data, 0, data.byteLength, true);
    } else {
      throw new Error("Unsupported data type");
    }
    CCFS.close(stream);
  }, chdir:function(path) {
    CCFS.currentPath = CCFS.resolvePath(path);
  }, ensureErrnoError:function() {
    CCFS.ErrnoError = function ErrnoError(errno, node) {
      this.node = node;
      this.errno = errno;
    };
    CCFS.ErrnoError.prototype = new Error();
    CCFS.ErrnoError.prototype.constructor = CCFS.ErrnoError;
  }};
  CCFS.ensureErrnoError();
}
function _IDBFS_storeRemoteEntry(store, path, entry, callback) {
  var req = store.put(entry, path);
  req.onsuccess = function() {
    callback(null);
  };
  req.onerror = function(e) {
    callback(this.error);
    e.preventDefault();
  };
}
function _interop_SaveNode(path) {
  var callback = function(err) {
    if (!err) {
      return;
    }
    console.log(err);
    ccall("Platform_LogError", "void", ["string"], ["&cError saving " + path]);
    ccall("Platform_LogError", "void", ["string"], ["   &c" + err]);
  };
  var stat, node, entry;
  try {
    var lookup = CCFS.lookupPath(path);
    node = lookup.node;
    node.contents = MEMFS.getFileDataAsTypedArray(node);
    entry = {timestamp:node.timestamp, mode:CCFS.MODE_TYPE_FILE, contents:node.contents};
  } catch (err$8) {
    return callback(err$8);
  }
  _IDBFS_getDB(function(err, db) {
    if (err) {
      return callback(err);
    }
    var transaction, store;
    try {
      transaction = db.transaction([IDBFS_DB_STORE_NAME], "readwrite");
      store = transaction.objectStore(IDBFS_DB_STORE_NAME);
    } catch (err$9) {
      return callback(err$9);
    }
    transaction.onerror = function(e) {
      callback(this.error);
      e.preventDefault();
    };
    _IDBFS_storeRemoteEntry(store, path, entry, callback);
  });
}
function _interop_FileClose(fd) {
  try {
    var stream = CCFS.getStream(fd);
    CCFS.close(stream);
    if ((stream.flags & 3) == 2) {
      _interop_SaveNode(stream.path);
    }
    return 0;
  } catch (e) {
    if (!(e instanceof CCFS.ErrnoError)) {
      abort(e);
    }
    return -e.errno;
  }
}
function _interop_FileCreate(raw, flags) {
  var path = UTF8ToString(raw);
  try {
    var stream = CCFS.open(path, flags);
    return stream.fd | 0;
  } catch (e) {
    if (!(e instanceof CCFS.ErrnoError)) {
      abort(e);
    }
    return -e.errno;
  }
}
function _interop_FileExists(raw) {
  var path = UTF8ToString(raw);
  path = CCFS.resolvePath(path);
  return path in CCFS.entries;
}
function _interop_FileLength(fd) {
  try {
    var stream = CCFS.getStream(fd);
    return stream.node.usedBytes | 0;
  } catch (e) {
    if (!(e instanceof CCFS.ErrnoError)) {
      abort(e);
    }
    return -e.errno;
  }
}
function _interop_FileRead(fd, dst, count) {
  try {
    var stream = CCFS.getStream(fd);
    return CCFS.read(stream, HEAP8, dst, count) | 0;
  } catch (e) {
    if (!(e instanceof CCFS.ErrnoError)) {
      abort(e);
    }
    return -e.errno;
  }
}
function _interop_FileSeek(fd, offset, whence) {
  try {
    var stream = CCFS.getStream(fd);
    return CCFS.llseek(stream, offset, whence) | 0;
  } catch (e) {
    if (!(e instanceof CCFS.ErrnoError)) {
      abort(e);
    }
    return -e.errno;
  }
}
function _interop_FileWrite(fd, src, count) {
  try {
    var stream = CCFS.getStream(fd);
    return CCFS.write(stream, HEAP8, src, count) | 0;
  } catch (e) {
    if (!(e instanceof CCFS.ErrnoError)) {
      abort(e);
    }
    return -e.errno;
  }
}
function _interop_ForceTouchPageLayout() {
  if (typeof forceTouchLayout === "function") {
    forceTouchLayout();
  }
}
function _interop_GetContainerID() {
  return document.getElementById("canvas_wrapper") ? 1 : 0;
}
function _interop_GetGpuRenderer(buffer, len) {
  var dbg = GLctx.getExtension("WEBGL_debug_renderer_info");
  var str = dbg ? GLctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "";
  stringToUTF8(str, buffer, len);
}
function _interop_GetLocalTime(time) {
  var date = new Date();
  HEAP32[(time | 0 + 0) >> 2] = date.getFullYear();
  HEAP32[(time | 0 + 4) >> 2] = date.getMonth() + 1 | 0;
  HEAP32[(time | 0 + 8) >> 2] = date.getDate();
  HEAP32[(time | 0 + 12) >> 2] = date.getHours();
  HEAP32[(time | 0 + 16) >> 2] = date.getMinutes();
  HEAP32[(time | 0 + 20) >> 2] = date.getSeconds();
}
function _interop_AudioLog(err) {
  console.log(err);
  window.AUDIO.errors.push("" + err);
  return window.AUDIO.errors.length | 0;
}
function _interop_InitAudio() {
  window.AUDIO = window.AUDIO || {context:null, sources:[], buffers:{}, errors:[], seen:{},};
  if (window.AUDIO.context) {
    return 0;
  }
  try {
    if (window.AudioContext) {
      AUDIO.context = new window.AudioContext();
    } else {
      AUDIO.context = new window.webkitAudioContext();
    }
    return 0;
  } catch (err$10) {
    return _interop_AudioLog(err$10);
  }
}
function _interop_InitContainer() {
  var agent = navigator.userAgent;
  var canvas = Module["canvas"];
  window.cc_container = document.body;
  if (/Android/i.test(agent)) {
    var wrapper = document.createElement("div");
    wrapper.id = "canvas_wrapper";
    canvas.parentNode.insertBefore(wrapper, canvas);
    wrapper.appendChild(canvas);
    window.cc_container = wrapper;
  }
}
function _interop_InitFilesystem(buffer) {
  if (!window.cc_idbErr) {
    return;
  }
  var msg = "Error preloading IndexedDB:" + window.cc_idbErr + "\n\nPreviously saved settings/maps will be lost";
  ccall("Platform_LogError", "void", ["string"], [msg]);
}
function _interop_InitModule() {
  window.ERRNO_CODES = {ENOENT:2, EBADF:9, EAGAIN:11, ENOMEM:12, EEXIST:17, EINVAL:22};
}
function _interop_InitSockets() {
  window.SOCKETS = {EBADF:-8, EISCONN:-30, ENOTCONN:-53, EAGAIN:-6, EHOSTUNREACH:-23, EINPROGRESS:-26, EALREADY:-7, ECONNRESET:-15, EINVAL:-28, ECONNREFUSED:-14, sockets:[],};
}
function _interop_IsAndroid() {
  return /Android/i.test(navigator.userAgent);
}
function _interop_IsHttpsOnly() {
  return location.protocol === "https:";
}
function _interop_IsIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints && navigator.maxTouchPoints > 2;
}
function _interop_LoadIndexedDB() {
}
function _interop_Log(msg, len) {
  Module.print(UTF8ArrayToString(HEAPU8, msg, len));
}
function _interop_OpenFileDialog(filter, action, folder) {
  var elem = window.cc_uploadElem;
  var root = UTF8ToString(folder);
  if (!elem) {
    elem = document.createElement("input");
    elem.setAttribute("type", "file");
    elem.setAttribute("style", "display: none");
    elem.accept = UTF8ToString(filter);
    elem.addEventListener("change", function(ev) {
      var files = ev.target.files;
      for (var i = 0; i < files.length; i++) {
        var reader = new FileReader();
        var name = files[i].name;
        reader.onload = function(e) {
          var data = new Uint8Array(e.target.result);
          var path = root + "/" + name;
          CCFS.writeFile(path, data);
          ccall("Window_OnFileUploaded", "void", ["string"], [path]);
          if (action == 0) {
            CCFS.unlink(path);
          }
          if (action == 1) {
            _interop_SaveNode(path);
          }
        };
        reader.readAsArrayBuffer(files[i]);
      }
      window.cc_container.removeChild(window.cc_uploadElem);
      window.cc_uploadElem = null;
    }, false);
    window.cc_uploadElem = elem;
    window.cc_container.appendChild(elem);
  }
  elem.click();
}
function _interop_OpenKeyboard(text, flags, placeholder) {
  var elem = window.cc_inputElem;
  var shown = true;
  var type = flags & 255;
  if (!elem) {
    if (type == 1) {
      elem = document.createElement("input");
      elem.setAttribute("type", "text");
      elem.setAttribute("inputmode", "decimal");
    } else if (type == 3) {
      elem = document.createElement("input");
      elem.setAttribute("type", "text");
      elem.setAttribute("inputmode", "numeric");
      elem.setAttribute("pattern", "[0-9]*");
    } else {
      elem = document.createElement("textarea");
    }
    shown = false;
  }
  if (flags & 256) {
    elem.setAttribute("enterkeyhint", "send");
  }
  elem.setAttribute("style", "position:absolute; left:0; bottom:0; margin: 0px; width: 100%; background-color: #222222; border: none; color: white;");
  elem.setAttribute("placeholder", UTF8ToString(placeholder));
  elem.value = UTF8ToString(text);
  if (!shown) {
    elem.addEventListener("touchstart", function(ev) {
      ev.stopPropagation();
    }, false);
    elem.addEventListener("touchmove", function(ev) {
      ev.stopPropagation();
    }, false);
    elem.addEventListener("mousedown", function(ev) {
      ev.stopPropagation();
    }, false);
    elem.addEventListener("mousemove", function(ev) {
      ev.stopPropagation();
    }, false);
    elem.addEventListener("input", function(ev) {
      ccall("Window_OnTextChanged", "void", ["string"], [ev.target.value]);
    }, false);
    window.cc_inputElem = elem;
    window.cc_divElem = document.createElement("div");
    window.cc_divElem.setAttribute("style", "position:absolute; left:0; top:0; width:100%; height:100%; background-color: black; opacity:0.4; resize:none; pointer-events:none;");
    window.cc_container.appendChild(window.cc_divElem);
    window.cc_container.appendChild(elem);
  }
  elem.focus();
  elem.click();
}
function _interop_OpenTab(url) {
  try {
    window.open(UTF8ToString(url));
  } catch (e) {
    console.log(e);
    return 1;
  }
  return 0;
}
function _interop_RequestCanvasResize() {
  if (typeof resizeGameCanvas === "function") {
    resizeGameCanvas();
  }
}
function _interop_ScreenHeight() {
  return screen.height;
}
function _interop_ScreenWidth() {
  return screen.width;
}
function _interop_SetFont(fontStr, size, flags) {
  if (!window.FONT_CANVAS) {
    window.FONT_CANVAS = document.createElement("canvas");
    window.FONT_CONTEXT = window.FONT_CANVAS.getContext("2d");
  }
  var prefix = "";
  if (flags & 1) {
    prefix += "Bold ";
  }
  size += 4;
  var font = UTF8ToString(fontStr);
  var ctx = window.FONT_CONTEXT;
  ctx.font = prefix + size + "px " + font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  return ctx;
}
function _interop_SetKeyboardText(text) {
  if (!window.cc_inputElem) {
    return;
  }
  var str = UTF8ToString(text);
  var cur = window.cc_inputElem.value;
  if (cur.length && cur[cur.length - 1] == "\n") {
    cur = cur.substring(0, cur.length - 1);
  }
  if (str != cur) {
    window.cc_inputElem.value = str;
  }
}
function _interop_SetPageTitle(title) {
  document.title = UTF8ToString(title);
}
function _interop_ShowDialog(title, msg) {
  alert(UTF8ToString(title) + "\n\n" + UTF8ToString(msg));
}
function _interop_SocketClose(sockFD) {
  var sock = SOCKETS.sockets[sockFD];
  if (!sock) {
    return SOCKETS.EBADF;
  }
  try {
    sock.socket.close();
  } catch (e) {
  }
  delete sock.socket;
  return 0;
}
function _interop_SocketConnect(sockFD, raw, port) {
  var addr = UTF8ToString(raw);
  var sock = SOCKETS.sockets[sockFD];
  if (!sock) {
    return SOCKETS.EBADF;
  }
  var ws = sock.socket;
  if (ws) {
    if (ws.readyState === ws.CONNECTING) {
      return SOCKETS.EALREADY;
    }
    return SOCKETS.EISCONN;
  }
  try {
    var parts = addr.split("/");
    var proto = _interop_IsHttpsOnly() ? "wss://" : "ws://";
    var url = proto + parts[0] + ":" + port + "/" + parts.slice(1).join("/");
    ws = new WebSocket(url, "ClassiCube");
    ws.binaryType = "arraybuffer";
  } catch (e) {
    return SOCKETS.EHOSTUNREACH;
  }
  sock.socket = ws;
  ws.onopen = function() {
  };
  ws.onclose = function() {
  };
  ws.onmessage = function(event) {
    var data = event.data;
    if (typeof data === "string") {
      var encoder = new TextEncoder();
      data = encoder.encode(data);
    } else {
      assert(data.byteLength !== undefined);
      if (data.byteLength == 0) {
        return;
      } else {
        data = new Uint8Array(data);
      }
    }
    sock.recv_queue.push(data);
  };
  ws.onerror = function(error) {
    sock.error = SOCKETS.ECONNREFUSED;
  };
  return SOCKETS.EINPROGRESS;
}
function _interop_SocketCreate() {
  var sock = {error:null, recv_queue:[], socket:null,};
  SOCKETS.sockets.push(sock);
  return SOCKETS.sockets.length - 1 | 0;
}
function _interop_SocketRecv(sockFD, dst, length) {
  var sock = SOCKETS.sockets[sockFD];
  if (!sock) {
    return SOCKETS.EBADF;
  }
  var packet = sock.recv_queue.shift();
  if (!packet) {
    var ws = sock.socket;
    if (!ws || ws.readyState == ws.CLOSING || ws.readyState == ws.CLOSED) {
      return SOCKETS.ENOTCONN;
    } else {
      return SOCKETS.EAGAIN;
    }
  }
  var packetLength = packet.byteLength || packet.length;
  var packetOffset = packet.byteOffset || 0;
  var packetBuffer = packet.buffer || packet;
  var bytesRead = Math.min(length, packetLength);
  var msg = new Uint8Array(packetBuffer, packetOffset, bytesRead);
  if (bytesRead < packetLength) {
    var bytesRemaining = packetLength - bytesRead;
    packet = new Uint8Array(packetBuffer, packetOffset + bytesRead, bytesRemaining);
    sock.recv_queue.unshift(packet);
  }
  HEAPU8.set(msg, dst);
  return msg.byteLength;
}
function _interop_SocketSend(sockFD, src, length) {
  var sock = SOCKETS.sockets[sockFD];
  if (!sock) {
    return SOCKETS.EBADF;
  }
  var ws = sock.socket;
  if (!ws || ws.readyState === ws.CLOSING || ws.readyState === ws.CLOSED) {
    return SOCKETS.ENOTCONN;
  } else if (ws.readyState === ws.CONNECTING) {
    return SOCKETS.EAGAIN;
  }
  var data = new Uint8Array(length);
  for (var i = 0; i < length; i++) {
    data[i] = HEAP8[src + i];
  }
  try {
    ws.send(data);
    return length;
  } catch (e) {
    return SOCKETS.EINVAL;
  }
}
function _interop_SocketWritable(sockFD, writable) {
  HEAPU8[writable | 0] = 0;
  var sock = SOCKETS.sockets[sockFD];
  if (!sock) {
    return SOCKETS.EBADF;
  }
  var ws = sock.socket;
  if (!ws) {
    return SOCKETS.ENOTCONN;
  }
  if (ws.readyState === ws.OPEN) {
    HEAPU8[writable | 0] = 1;
  }
  return sock.error || 0;
}
function _interop_TakeScreenshot(path) {
  var name = UTF8ToString(path);
  var canvas = Module["canvas"];
  if (canvas.toBlob) {
    canvas.toBlob(function(blob) {
      _interop_SaveBlob(blob, name);
    });
  } else if (canvas.msToBlob) {
    _interop_SaveBlob(canvas.msToBlob(), name);
  }
}
function _interop_TextDraw(textStr, textLen, bmp, dstX, dstY, shadow, hexStr) {
  var text = UTF8ArrayToString(HEAPU8, textStr, textLen);
  var hex = UTF8ArrayToString(HEAPU8, hexStr, 7);
  var ctx = window.FONT_CONTEXT;
  var data = ctx.measureText(text);
  var text_width = Math.ceil(data.width) | 0;
  if (text_width > ctx.canvas.width) {
    var font = ctx.font;
    ctx.canvas.width = text_width;
    ctx.font = font;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }
  var text_offset = 0.0;
  ctx.fillStyle = hex;
  if (shadow) {
    text_offset = 1.3;
  }
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillText(text, text_offset, text_offset);
  bmp = bmp | 0;
  dstX = dstX | 0;
  dstY = dstY | 0;
  var dst_pixels = HEAP32[(bmp + 0 | 0) >> 2] + (dstX << 2);
  var dst_width = HEAP32[(bmp + 4 | 0) >> 2];
  var dst_height = HEAP32[(bmp + 8 | 0) >> 2];
  var src = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  var src_pixels = src.data;
  var src_width = src.width | 0;
  var src_height = src.height | 0;
  var img_width = Math.min(src_width, dst_width);
  var img_height = Math.min(src_height, dst_height);
  for (var y = 0; y < img_height; y++) {
    var yy = y + dstY;
    if (yy < 0 || yy >= dst_height) {
      continue;
    }
    var src_row = y * (src_width << 2) | 0;
    var dst_row = dst_pixels + yy * (dst_width << 2) | 0;
    for (var x = 0; x < img_width; x++) {
      var xx = x + dstX;
      if (xx < 0 || xx >= dst_width) {
        continue;
      }
      var I = src_pixels[src_row + (x << 2) + 3], invI = 255 - I | 0;
      HEAPU8[dst_row + (x << 2) + 0] = (src_pixels[src_row + (x << 2) + 0] * I >> 8) + (HEAPU8[dst_row + (x << 2) + 0] * invI >> 8);
      HEAPU8[dst_row + (x << 2) + 1] = (src_pixels[src_row + (x << 2) + 1] * I >> 8) + (HEAPU8[dst_row + (x << 2) + 1] * invI >> 8);
      HEAPU8[dst_row + (x << 2) + 2] = (src_pixels[src_row + (x << 2) + 2] * I >> 8) + (HEAPU8[dst_row + (x << 2) + 2] * invI >> 8);
      HEAPU8[dst_row + (x << 2) + 3] = I + (HEAPU8[dst_row + (x << 2) + 3] * invI >> 8);
    }
  }
  return data.width;
}
function _interop_TextWidth(textStr, textLen) {
  var text = UTF8ArrayToString(HEAPU8, textStr, textLen);
  var ctx = window.FONT_CONTEXT;
  var data = ctx.measureText(text);
  return data.width;
}
function _interop_TryGetClipboardText() {
  if (window.clipboardData) {
    var contents = window.clipboardData.getData("Text");
    ccall("Window_StoreClipboardText", "void", ["string"], [contents]);
  }
}
function _interop_TrySetClipboardText(text) {
  if (window.clipboardData) {
    if (window.getSelection && window.getSelection().toString()) {
      return;
    }
    window.clipboardData.setData("Text", UTF8ToString(text));
  } else {
    window.cc_copyText = UTF8ToString(text);
  }
}
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}
Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
  Browser.requestFullscreen(lockPointer, resizeCanvas);
};
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
  Browser.requestAnimationFrame(func);
};
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
  Browser.setCanvasSize(width, height, noUpdates);
};
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
  Browser.mainLoop.pause();
};
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
  Browser.mainLoop.resume();
};
Module["getUserMedia"] = function Module_getUserMedia() {
  Browser.getUserMedia();
};
Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
  return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
};
var preloadedImages = {};
var preloadedAudios = {};
var FSNode = function(parent, name, mode, rdev) {
  if (!parent) {
    parent = this;
  }
  this.parent = parent;
  this.mount = parent.mount;
  this.mounted = null;
  this.id = FS.nextInode++;
  this.name = name;
  this.mode = mode;
  this.node_ops = {};
  this.stream_ops = {};
  this.rdev = rdev;
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {read:{get:function() {
  return (this.mode & readMode) === readMode;
}, set:function(val) {
  val ? this.mode |= readMode : this.mode &= ~readMode;
}}, write:{get:function() {
  return (this.mode & writeMode) === writeMode;
}, set:function(val) {
  val ? this.mode |= writeMode : this.mode &= ~writeMode;
}}, isFolder:{get:function() {
  return FS.isDir(this.mode);
}}, isDevice:{get:function() {
  return FS.isChrdev(this.mode);
}}});
FS.FSNode = FSNode;
FS.staticInit();
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_unlink"] = FS.unlink;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createDevice"] = FS.createDevice;
var GLctx;
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
for (var i = 0; i < 288; ++i) {
  miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1);
}
var ASSERTIONS = false;
var decodeBase64 = typeof atob == "function" ? atob : function(input) {
  var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var output = "";
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  input = input.replace(/[^A-Za-z0-9\+\/=]/g, "");
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));
    chr1 = enc1 << 2 | enc2 >> 4;
    chr2 = (enc2 & 15) << 4 | enc3 >> 2;
    chr3 = (enc3 & 3) << 6 | enc4;
    output = output + String.fromCharCode(chr1);
    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};
function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE == "boolean" && ENVIRONMENT_IS_NODE) {
    var buf = Buffer.from(s, "base64");
    return new Uint8Array(buf["buffer"], buf["byteOffset"], buf["byteLength"]);
  }
  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0; i < decoded.length; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error("Converting base64 string to bytes failed.");
  }
}
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }
  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}
var asmLibraryArg = {"emscripten_cancel_main_loop":_emscripten_cancel_main_loop, "emscripten_date_now":_emscripten_date_now, "emscripten_exit_fullscreen":_emscripten_exit_fullscreen, "emscripten_exit_pointerlock":_emscripten_exit_pointerlock, "emscripten_get_device_pixel_ratio":_emscripten_get_device_pixel_ratio, "emscripten_get_element_css_size":_emscripten_get_element_css_size, "emscripten_get_fullscreen_status":_emscripten_get_fullscreen_status, "emscripten_get_now":_emscripten_get_now, "emscripten_get_pointerlock_status":_emscripten_get_pointerlock_status, 
"emscripten_is_webgl_context_lost":_emscripten_is_webgl_context_lost, "emscripten_memcpy_big":_emscripten_memcpy_big, "emscripten_request_fullscreen_strategy":_emscripten_request_fullscreen_strategy, "emscripten_request_pointerlock":_emscripten_request_pointerlock, "emscripten_resize_heap":_emscripten_resize_heap, "emscripten_resume_main_loop":_emscripten_resume_main_loop, "emscripten_set_beforeunload_callback_on_thread":_emscripten_set_beforeunload_callback_on_thread, "emscripten_set_blur_callback_on_thread":_emscripten_set_blur_callback_on_thread, 
"emscripten_set_canvas_element_size":_emscripten_set_canvas_element_size, "emscripten_set_element_css_size":_emscripten_set_element_css_size, "emscripten_set_focus_callback_on_thread":_emscripten_set_focus_callback_on_thread, "emscripten_set_fullscreenchange_callback_on_thread":_emscripten_set_fullscreenchange_callback_on_thread, "emscripten_set_keydown_callback_on_thread":_emscripten_set_keydown_callback_on_thread, "emscripten_set_keypress_callback_on_thread":_emscripten_set_keypress_callback_on_thread, 
"emscripten_set_keyup_callback_on_thread":_emscripten_set_keyup_callback_on_thread, "emscripten_set_main_loop":_emscripten_set_main_loop, "emscripten_set_main_loop_timing":_emscripten_set_main_loop_timing, "emscripten_set_mousedown_callback_on_thread":_emscripten_set_mousedown_callback_on_thread, "emscripten_set_mousemove_callback_on_thread":_emscripten_set_mousemove_callback_on_thread, "emscripten_set_mouseup_callback_on_thread":_emscripten_set_mouseup_callback_on_thread, "emscripten_set_resize_callback_on_thread":_emscripten_set_resize_callback_on_thread, 
"emscripten_set_touchcancel_callback_on_thread":_emscripten_set_touchcancel_callback_on_thread, "emscripten_set_touchend_callback_on_thread":_emscripten_set_touchend_callback_on_thread, "emscripten_set_touchmove_callback_on_thread":_emscripten_set_touchmove_callback_on_thread, "emscripten_set_touchstart_callback_on_thread":_emscripten_set_touchstart_callback_on_thread, "emscripten_set_visibilitychange_callback_on_thread":_emscripten_set_visibilitychange_callback_on_thread, "emscripten_set_webglcontextlost_callback_on_thread":_emscripten_set_webglcontextlost_callback_on_thread, 
"emscripten_set_wheel_callback_on_thread":_emscripten_set_wheel_callback_on_thread, "emscripten_webgl_create_context":_emscripten_webgl_create_context, "emscripten_webgl_destroy_context":_emscripten_webgl_destroy_context, "emscripten_webgl_init_context_attributes":_emscripten_webgl_init_context_attributes, "emscripten_webgl_make_context_current":_emscripten_webgl_make_context_current, "exit":_exit, "glAttachShader":_glAttachShader, "glBindAttribLocation":_glBindAttribLocation, "glBindBuffer":_glBindBuffer, 
"glBindTexture":_glBindTexture, "glBlendFunc":_glBlendFunc, "glBufferData":_glBufferData, "glBufferSubData":_glBufferSubData, "glClear":_glClear, "glClearColor":_glClearColor, "glColorMask":_glColorMask, "glCompileShader":_glCompileShader, "glCreateProgram":_glCreateProgram, "glCreateShader":_glCreateShader, "glDeleteBuffers":_glDeleteBuffers, "glDeleteProgram":_glDeleteProgram, "glDeleteShader":_glDeleteShader, "glDeleteTextures":_glDeleteTextures, "glDepthFunc":_glDepthFunc, "glDepthMask":_glDepthMask, 
"glDetachShader":_glDetachShader, "glDisable":_glDisable, "glDisableVertexAttribArray":_glDisableVertexAttribArray, "glDrawArrays":_glDrawArrays, "glDrawElements":_glDrawElements, "glEnable":_glEnable, "glEnableVertexAttribArray":_glEnableVertexAttribArray, "glGenBuffers":_glGenBuffers, "glGenTextures":_glGenTextures, "glGetIntegerv":_glGetIntegerv, "glGetProgramInfoLog":_glGetProgramInfoLog, "glGetProgramiv":_glGetProgramiv, "glGetShaderInfoLog":_glGetShaderInfoLog, "glGetShaderiv":_glGetShaderiv, 
"glGetString":_glGetString, "glGetUniformLocation":_glGetUniformLocation, "glLinkProgram":_glLinkProgram, "glShaderSource":_glShaderSource, "glTexImage2D":_glTexImage2D, "glTexParameteri":_glTexParameteri, "glTexSubImage2D":_glTexSubImage2D, "glUniform1f":_glUniform1f, "glUniform2f":_glUniform2f, "glUniform3f":_glUniform3f, "glUniformMatrix4fv":_glUniformMatrix4fv, "glUseProgram":_glUseProgram, "glVertexAttribPointer":_glVertexAttribPointer, "glViewport":_glViewport, "interop_AddClipboardListeners":_interop_AddClipboardListeners, 
"interop_AdjustXY":_interop_AdjustXY, "interop_AsyncDownloadTexturePack":_interop_AsyncDownloadTexturePack, "interop_AsyncLoadIndexedDB":_interop_AsyncLoadIndexedDB, "interop_AudioClose":_interop_AudioClose, "interop_AudioCreate":_interop_AudioCreate, "interop_AudioDescribe":_interop_AudioDescribe, "interop_AudioPlay":_interop_AudioPlay, "interop_AudioPoll":_interop_AudioPoll, "interop_CanvasHeight":_interop_CanvasHeight, "interop_CanvasWidth":_interop_CanvasWidth, "interop_CloseKeyboard":_interop_CloseKeyboard, 
"interop_DirectoryIter":_interop_DirectoryIter, "interop_DirectorySetWorking":_interop_DirectorySetWorking, "interop_DownloadAsync":_interop_DownloadAsync, "interop_DownloadFile":_interop_DownloadFile, "interop_EnterFullscreen":_interop_EnterFullscreen, "interop_FS_Init":_interop_FS_Init, "interop_FileClose":_interop_FileClose, "interop_FileCreate":_interop_FileCreate, "interop_FileExists":_interop_FileExists, "interop_FileLength":_interop_FileLength, "interop_FileRead":_interop_FileRead, "interop_FileSeek":_interop_FileSeek, 
"interop_FileWrite":_interop_FileWrite, "interop_ForceTouchPageLayout":_interop_ForceTouchPageLayout, "interop_GetContainerID":_interop_GetContainerID, "interop_GetGpuRenderer":_interop_GetGpuRenderer, "interop_GetLocalTime":_interop_GetLocalTime, "interop_InitAudio":_interop_InitAudio, "interop_InitContainer":_interop_InitContainer, "interop_InitFilesystem":_interop_InitFilesystem, "interop_InitModule":_interop_InitModule, "interop_InitSockets":_interop_InitSockets, "interop_IsAndroid":_interop_IsAndroid, 
"interop_IsHttpsOnly":_interop_IsHttpsOnly, "interop_IsIOS":_interop_IsIOS, "interop_LoadIndexedDB":_interop_LoadIndexedDB, "interop_Log":_interop_Log, "interop_OpenFileDialog":_interop_OpenFileDialog, "interop_OpenKeyboard":_interop_OpenKeyboard, "interop_OpenTab":_interop_OpenTab, "interop_RequestCanvasResize":_interop_RequestCanvasResize, "interop_ScreenHeight":_interop_ScreenHeight, "interop_ScreenWidth":_interop_ScreenWidth, "interop_SetFont":_interop_SetFont, "interop_SetKeyboardText":_interop_SetKeyboardText, 
"interop_SetPageTitle":_interop_SetPageTitle, "interop_ShowDialog":_interop_ShowDialog, "interop_SocketClose":_interop_SocketClose, "interop_SocketConnect":_interop_SocketConnect, "interop_SocketCreate":_interop_SocketCreate, "interop_SocketRecv":_interop_SocketRecv, "interop_SocketSend":_interop_SocketSend, "interop_SocketWritable":_interop_SocketWritable, "interop_TakeScreenshot":_interop_TakeScreenshot, "interop_TextDraw":_interop_TextDraw, "interop_TextWidth":_interop_TextWidth, "interop_TryGetClipboardText":_interop_TryGetClipboardText, 
"interop_TrySetClipboardText":_interop_TrySetClipboardText};
var asm = createWasm();
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
  return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["__wasm_call_ctors"]).apply(null, arguments);
};
var _Http_OnUpdateProgress = Module["_Http_OnUpdateProgress"] = function() {
  return (_Http_OnUpdateProgress = Module["_Http_OnUpdateProgress"] = Module["asm"]["Http_OnUpdateProgress"]).apply(null, arguments);
};
var _Http_OnFinishedAsync = Module["_Http_OnFinishedAsync"] = function() {
  return (_Http_OnFinishedAsync = Module["_Http_OnFinishedAsync"] = Module["asm"]["Http_OnFinishedAsync"]).apply(null, arguments);
};
var _malloc = Module["_malloc"] = function() {
  return (_malloc = Module["_malloc"] = Module["asm"]["malloc"]).apply(null, arguments);
};
var _free = Module["_free"] = function() {
  return (_free = Module["_free"] = Module["asm"]["free"]).apply(null, arguments);
};
var _Directory_IterCallback = Module["_Directory_IterCallback"] = function() {
  return (_Directory_IterCallback = Module["_Directory_IterCallback"] = Module["asm"]["Directory_IterCallback"]).apply(null, arguments);
};
var _Platform_LogError = Module["_Platform_LogError"] = function() {
  return (_Platform_LogError = Module["_Platform_LogError"] = Module["asm"]["Platform_LogError"]).apply(null, arguments);
};
var _main = Module["_main"] = function() {
  return (_main = Module["_main"] = Module["asm"]["__main_argc_argv"]).apply(null, arguments);
};
var _main_phase1 = Module["_main_phase1"] = function() {
  return (_main_phase1 = Module["_main_phase1"] = Module["asm"]["main_phase1"]).apply(null, arguments);
};
var _main_phase2 = Module["_main_phase2"] = function() {
  return (_main_phase2 = Module["_main_phase2"] = Module["asm"]["main_phase2"]).apply(null, arguments);
};
var _Window_RequestClipboardText = Module["_Window_RequestClipboardText"] = function() {
  return (_Window_RequestClipboardText = Module["_Window_RequestClipboardText"] = Module["asm"]["Window_RequestClipboardText"]).apply(null, arguments);
};
var _Window_StoreClipboardText = Module["_Window_StoreClipboardText"] = function() {
  return (_Window_StoreClipboardText = Module["_Window_StoreClipboardText"] = Module["asm"]["Window_StoreClipboardText"]).apply(null, arguments);
};
var _Window_GotClipboardText = Module["_Window_GotClipboardText"] = function() {
  return (_Window_GotClipboardText = Module["_Window_GotClipboardText"] = Module["asm"]["Window_GotClipboardText"]).apply(null, arguments);
};
var _Window_OnFileUploaded = Module["_Window_OnFileUploaded"] = function() {
  return (_Window_OnFileUploaded = Module["_Window_OnFileUploaded"] = Module["asm"]["Window_OnFileUploaded"]).apply(null, arguments);
};
var _Window_OnTextChanged = Module["_Window_OnTextChanged"] = function() {
  return (_Window_OnTextChanged = Module["_Window_OnTextChanged"] = Module["asm"]["Window_OnTextChanged"]).apply(null, arguments);
};
var ___errno_location = Module["___errno_location"] = function() {
  return (___errno_location = Module["___errno_location"] = Module["asm"]["__errno_location"]).apply(null, arguments);
};
var stackSave = Module["stackSave"] = function() {
  return (stackSave = Module["stackSave"] = Module["asm"]["stackSave"]).apply(null, arguments);
};
var stackRestore = Module["stackRestore"] = function() {
  return (stackRestore = Module["stackRestore"] = Module["asm"]["stackRestore"]).apply(null, arguments);
};
var stackAlloc = Module["stackAlloc"] = function() {
  return (stackAlloc = Module["stackAlloc"] = Module["asm"]["stackAlloc"]).apply(null, arguments);
};
Module["addRunDependency"] = addRunDependency;
Module["removeRunDependency"] = removeRunDependency;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
var calledRun;
dependenciesFulfilled = function runCaller() {
  if (!calledRun) {
    run();
  }
  if (!calledRun) {
    dependenciesFulfilled = runCaller;
  }
};
function callMain(args) {
  var entryFunction = Module["_main"];
  args = args || [];
  args.unshift(thisProgram);
  var argc = args.length;
  var argv = stackAlloc((argc + 1) * 4);
  var argv_ptr = argv >> 2;
  args.forEach(function(arg) {
    HEAP32[argv_ptr++] = allocateUTF8OnStack(arg);
  });
  HEAP32[argv_ptr] = 0;
  try {
    var ret = entryFunction(argc, argv);
    exitJS(ret, true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}
function run(args) {
  args = args || arguments_;
  if (runDependencies > 0) {
    return;
  }
  preRun();
  if (runDependencies > 0) {
    return;
  }
  function doRun() {
    if (calledRun) {
      return;
    }
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT) {
      return;
    }
    initRuntime();
    preMain();
    if (Module["onRuntimeInitialized"]) {
      Module["onRuntimeInitialized"]();
    }
    if (shouldRunNow) {
      callMain(args);
    }
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function() {
      setTimeout(function() {
        Module["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function") {
    Module["preInit"] = [Module["preInit"]];
  }
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
  shouldRunNow = false;
}
run();

