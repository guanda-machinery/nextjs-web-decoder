importScripts('/funcodeDecoder/encoding.js');
importScripts('/funcodeDecoder/decode_demo.js');

// domain check 的部分使用 lifftestlocaltest 做為開發的啟動碼
const errorMap = new Map([
  [-1, 'account checking is fail'],
  [-2, 'domain checking is fail'],
  [-3, 'device checking is fail'],
  [-4, 'total count > scan limit'],
  [-6, 'license is expired'],
  [-8, 'license format invalid'],
  [-11, 'License status is invalid']
]);

function checkReturnCode(returnCode) {
  return returnCode >= 0;
}

function getErrorMsg(returnCode) {
  let msg = errorMap.get(returnCode);
  msg = msg || `error Code:${returnCode}`;
  return msg;
}

function postMsg(code, msg, act) {
  const result = { code, msg, act };
  postMessage(result);
}

let initOk = false;
// let decodeImgPtr = null;
// let initWidth = null;
// let initHeight = null;
Module.onRuntimeInitialized = async_ => {
  const api = {
      create_buffer: Module.cwrap('create_buffer', 'number', ['number', 'number']),
      destroy_buffer: Module.cwrap('destroy_buffer', '', ['number']),
      decode: Module.cwrap('decode', '', ['number', 'number', 'number']),
      free_result: Module.cwrap('free_result', '', ['number']),
      get_result_pointer: Module.cwrap('get_result_pointer', 'number', []),
      get_result_size: Module.cwrap('get_result_size', 'number', []),
      funcodeInit: Module.cwrap('funcodeInit', 'number', ['number', 'number', 'number', 'number', 'number']),
      setLicData: Module.cwrap('setLicData', 'number', ['number', 'number']),
      getLicData: Module.cwrap('getLicData', 'number', ['number'])
  }

  function _init(startupcode, host, did, lit) {
    let p1Ptr = allocateUTF8(startupcode);
    let p2Ptr = allocateUTF8(host);
    let p3Ptr = allocateUTF8(did);
    let p4Ptr = allocateUTF8(lit);
    let litSize = lengthBytesUTF8(lit);            
    const returnCode = api.funcodeInit(p1Ptr, p2Ptr, p3Ptr, p4Ptr, litSize);
    _free(p1Ptr);
    _free(p2Ptr);
    _free(p3Ptr);
    _free(p4Ptr);
    if (checkReturnCode(returnCode)) {
      // initWidth = width;
      // initHeight = height;
      // decodeImgPtr = api.create_buffer(width, height);
      initOk = true;
      postMsg(0, 'decoder ready.', 'init');
    } else {
      postMsg(returnCode, getErrorMsg(returnCode), 'init');
    }
  }
  function _setLit(lit) {
    let p1Ptr = allocateUTF8(lit);
    let litSize = lengthBytesUTF8(lit);
    const returnCode = api.setLicData(p1Ptr, litSize);
    _free(p1Ptr);
    if (!checkReturnCode(returnCode)) {
      postMsg(returnCode, getErrorMsg(returnCode), 'setLit');
    } else {
      postMsg(0, lit, 'setLit');
    }
  }        
  function _getLit() {            
    let outPtr = _malloc(2048);
    const returnCode = api.getLicData(outPtr);
    const outputString = returnCode > 0 ? UTF8ToString(outPtr, returnCode) : '';
    _free(outPtr);
    if (checkReturnCode(returnCode)) {
      postMsg(0, outputString, 'getLit');
    } else {
      postMsg(returnCode, getErrorMsg(returnCode), 'getLit');
    }
    return outputString;
  }
  function _decode (image) {
    const start = performance.now();
    let checkModuleHEAP8set = null;
    const decodeImgPtr = api.create_buffer(image.width, image.height);
    let returnCode = -99;
   
    Module.HEAP8.set(image.data, decodeImgPtr);
    checkModuleHEAP8set = performance.now();
    returnCode = api.decode(decodeImgPtr, image.width, image.height);
    
    const end = performance.now();

    if (checkReturnCode(returnCode)) {
      const resultPointer = api.get_result_pointer();
      const resultSize = api.get_result_size();
          
      const resultView = new Uint8Array(Module.HEAP8.buffer, resultPointer, resultSize);
      const result = new Uint8Array(resultView);
      api.free_result(resultPointer);
      api.destroy_buffer(decodeImgPtr);
      const res_string = resultSize > 0 ? new TextDecoder().decode(result) : '';
      if (checkModuleHEAP8set !== null) {
        postMsg(Math.round(end - start), `end-start: ${Math.round(end - start)}, HEAP8set-start: ${Math.round(checkModuleHEAP8set - start)}, end-HEAP8set: ${Math.round(end - checkModuleHEAP8set)}`, 'decodemonitor');
      }
      postMsg(Math.round(end - start), res_string, 'decode');
    } else {
      postMsg(returnCode, getErrorMsg(returnCode), 'decode');
    }
  }

  // function _terminate() {
  //   api.destroy_buffer(decodeImgPtr);
  //   postMsg(0, 'destroy_buffer ok.', 'terminate');
  // }
  onmessage = function(event) {
      const data = event.data
      if (initOk) {
          if (data.act === 'getLit') {
              _getLit();
          } else if (data.act === 'setLit') {
              _setLit(data.lit);
          // } else if (data.act === 'terminate') {
          //   _terminate();
          } else if (data.width && data.height) {
              _decode(data);
          }
      } else if (data.act === 'init') {
          _init(data.startupcode, data.host, data.did, data.lit, data.width, data.height);
      }
  }

  postMsg(0, 'worker ready.', 'loaded');
};