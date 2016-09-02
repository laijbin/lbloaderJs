/**
 * lbloaderJs v0.0.1
 * lbloaderJs is a simple mini amd module loader for js 
 * @author laijbin[laijbin@126.com]
 */
;(function(win, doc, undefined) {

  var cachedMod = {},
      scripts = scripts(),
      loaderScript = scripts[scripts.length - 1],//lbloaderJs放在其他脚本后引用
      loaderUrl = loaderScript.src,
      dataMain = loaderScript.getAttribute('data-main'),
      baseUrl = loaderScript.getAttribute('data-url')||loaderUrl.slice(0, loaderUrl.lastIndexOf('/') + 1),
      depsQueue = {},
      STATUS = {
        UNLOAD: 0,
        LOADING: 1,
        LOADED: 2
      },
      entry = [];

  // utils
  function isType(obj, type) {
    return {}.toString.call(obj) === '[object ' + type + ']';
  }
  function each(arr, func) {
    if (isType(arr,'Array')) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i]!=undefined && func(arr[i], i, arr)) {break;}
      };
    } else {
      for(var k in arr){
        if (arr[k]!=undefined && func(arr[k], k, arr)) {break;}
      }
    }
  }
  function scripts() {
      return doc.getElementsByTagName('script');
  }

  // core Module
  function Module(id, deps, factory) {
    this.id = id;
    this.deps = factory ? deps : [];
    this.factory = factory ? factory : deps;
    cachedMod[id] = this;
    addDepsQueue(this.deps);
    depsQueue[id] = STATUS.LOADED;
  }
  Module.prototype = {
    constructor: Module,
    getDepsExports: function() {
      return this.factory.apply(this,this._require(this));
    },
    _require: function(mod) {
      var exports = [];
      each(mod.deps,function(v, i, arr){
        var mi = cachedMod[v];
        exports.push(mi.exports || (mi.exports = mi.getDepsExports()))
      })
      return exports
    }
  };


  // module manage
  function addDepsQueue(deps) {
    each(deps, function(v, i, arr){
      var status = depsQueue[v];
      depsQueue[v] = status ? status : STATUS.UNLOAD;
    })
  }

  function checkDepsStatus() {   
    var isLoadFinish = true;
    each(depsQueue,function(v, i, arr){
      if (v < STATUS.LOADED) {
        isLoadFinish = false;
        return true;//停止循环
      }
    })
    return isLoadFinish;
  }

  function getDeps() {
    each(depsQueue,function(v, i, arr){
      if (v<STATUS.LOADING) loadMod(i)
    })
  }

  function loadMod(id) {
    depsQueue[id] = STATUS.LOADING;
    loadScript(id, function(){
      if (checkDepsStatus()) {
        //入口模块执行
        while (entry.length) {
            cachedMod[entry.shift()].getDepsExports();
          }
      } else {
        getDeps();
      }
    })
  }

  function loadScript(id, callback) {
    var script = doc.createElement('script'),
        headNode = doc.getElementsByTagName('head')[0];
    script.onload = script.onreadystatechange = function() {
      if (/loaded|complete|undefined/.test(script.readyState)) {
        script.onload = script.onreadystatechange = undefined;
        script.parentNode.removeChild(script);
        script = undefined;
        if(callback) callback();
      }
    };
    script.src = baseUrl + id + '.js';
    headNode.appendChild(script);
  }

  // public 
  function define(id, deps, factory) {
    // 目前仅支持define(id,factory),define(id, deps, factory)
    // 要支持define(deps, factory)可使用currentScript
    new Module(id, deps, factory);
  }

  function use(id) {
    entry.push(id);
    addDepsQueue([id]);
    getDeps();
  }

  win.lbloader = {
    version: '0.0.2',
    main: dataMain,
    use: use,
    define: define,
    cachedMod: cachedMod
  };
  win.define = define;

  if (dataMain) lbloader.use(dataMain);//没设置data-main不自动调用

})(window, document);

