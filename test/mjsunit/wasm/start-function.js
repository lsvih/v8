// Copyright 2016 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --expose-wasm

load("test/mjsunit/wasm/wasm-constants.js");
load("test/mjsunit/wasm/wasm-module-builder.js");

function instantiate(sig, body) {
  var builder = new WasmModuleBuilder();

  var func = builder.addFunction("", sig)
    .addBody(body);

  builder.addStart(func.index);

  return builder.instantiate();
}

function assertVerifies(sig, body) {
  var module = instantiate(sig, body);
  assertFalse(module === undefined);
  assertFalse(module === null);
  assertFalse(module === 0);
  assertEquals("object", typeof module);
  return module;
}

assertVerifies(kSig_v_v, [kExprNop]);

// Arguments aren't allow to start functions.
assertThrows(() => {instantiate(kSig_i_i, [kExprGetLocal, 0]);});
assertThrows(() => {instantiate(kSig_i_ii, [kExprGetLocal, 0]);});
assertThrows(() => {instantiate(kSig_i_dd, [kExprGetLocal, 0]);});
assertThrows(() => {instantiate(kSig_i_v, [kExprI8Const, 0]);});

(function testInvalidIndex() {
  print("testInvalidIndex");
  var builder = new WasmModuleBuilder();

  var func = builder.addFunction("", kSig_v_v)
    .addBody([kExprNop]);

  builder.addStart(func.index + 1);

  assertThrows(builder.instantiate);
})();


(function testTwoStartFuncs() {
  print("testTwoStartFuncs");
  var builder = new WasmModuleBuilder();

  var func = builder.addFunction("", kSig_v_v)
    .addBody([kExprNop]);

  builder.addExplicitSection([kStartSectionCode, 0]);
  builder.addExplicitSection([kStartSectionCode, 0]);

  assertThrows(builder.instantiate);
})();


(function testRun1() {
  print("testRun1");
  var builder = new WasmModuleBuilder();

  builder.addMemory(12, 12, true);

  var func = builder.addFunction("", kSig_v_v)
    .addBody([kExprI8Const, 0, kExprI8Const, 66, kExprI32StoreMem, 0, 0]);

  builder.addStart(func.index);

  var module = builder.instantiate();
  var memory = module.exports.memory.buffer;
  var view = new Int8Array(memory);
  assertEquals(66, view[0]);
})();

(function testRun2() {
  print("testRun2");
  var builder = new WasmModuleBuilder();

  builder.addMemory(12, 12, true);

  var func = builder.addFunction("", kSig_v_v)
    .addBody([kExprI8Const, 0, kExprI8Const, 22, kExprI8Const, 55, kExprI32Add, kExprI32StoreMem, 0, 0]);

  builder.addStart(func.index);

  var module = builder.instantiate();
  var memory = module.exports.memory.buffer;
  var view = new Int8Array(memory);
  assertEquals(77, view[0]);
})();

(function testStartFFI() {
  print("testStartFFI");
  var ranned = false;
  var ffi = {gak: {foo : function() {
    print("we ranned at stert!");
    ranned = true;
  }}};

  var builder = new WasmModuleBuilder();
  var sig_index = builder.addType(kSig_v_v);

  builder.addImport("gak", "foo", sig_index);
  var func = builder.addFunction("", sig_index)
    .addBody([kExprCallFunction, 0]);

  builder.addStart(func.index);

  var module = builder.instantiate(ffi);
  assertTrue(ranned);
})();