function NSGetModule(compMgr, fileSpec) { return Module; }
function NSGetFactory() { return Factory; }

var Module = {
 CID: Components.ID("{e9f7950e-d78d-4aaa-900a-c43588052eba}"),
 contractID: "@dorando.at/keyconfig;1",
 className: "keyconfigService",

 registerSelf: function (aComponentManager, aFileSpec, aLocation, aType) {
  aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);

  aComponentManager.registerFactoryLocation(this.CID, this.className, this.contractID, aFileSpec, aLocation, aType);

  var CategoryManager = Components.classes["@mozilla.org/categorymanager;1"]
                                  .getService(Components.interfaces.nsICategoryManager);
  CategoryManager.addCategoryEntry("app-startup", this.className, "service," + this.contractID, true, true, null);
 },
  
 getClassObject: function (aComponentManager, aCID, aIID) {
  if (!aIID.equals(Components.interfaces.nsIFactory)) throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

  if (aCID.equals(this.CID)) return Factory;
    
  throw Components.results.NS_ERROR_NO_INTERFACE;
 },

 canUnload: function () { return true; }
};

var Factory = {
 createInstance: function (aOuter, aIID)
 {
  if (aOuter != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

  return new keyconfigService();
 }
};

function keyconfigService() {
 this.os.addObserver(this,"domwindowopened",false);
}

keyconfigService.prototype = {
 js: Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader),
 os: Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService),
 ps: Components.classes['@mozilla.org/preferences-service;1']
               .getService(Components.interfaces.nsIPrefService).getBranch(""),

 observe: function (aSubject, aTopic, aData) {
  if(aTopic == "domwindowopened") {
   aSubject.keyconfig = {service: this};
   aSubject.addEventListener("load",this.load,true);
  }
 },

 load: function(event) {
  this.removeEventListener(event.type,this.keyconfig.service.load,true);

  this.addEventListener(event.eventPhase == 2 ? "pageshow" : "load",this.keyconfig.service.init,false);
 },

 init: function(event) {
  if(event && event.eventPhase != 2) return;

  this.removeEventListener("pageshow",this.keyconfig.service.init,false);

  this.keyconfig.removedKeys = this.document.documentElement.appendChild(this.document.createElement("keyconfig"));

  this.keyconfig.profile = "keyconfig." + this.keyconfig.service.ps.getCharPref("keyconfig.profile") + ".";

  var i, l;

  var keyset = this.document.getElementsByTagName("keyset")[0] ||
               this.document.documentElement.appendChild(this.document.createElement("keyset"));

  var code = this.keyconfig.service.ps.getCharPref("keyconfig.global.20110522");
  if(code) {
   this.keyconfig.service.document = this.document;
   with(this.keyconfig.service) eval(code);
   delete this.keyconfig.service.document;
  }

  var nodes = this.document.getElementsByTagName("key");
  for(i = 0, l = nodes.length; i < l; i++) if(!nodes[i].id)
   nodes[i].id = "xxx_key"+ i +"_"+nodes[i].getAttribute("command")+nodes[i].getAttribute("oncommand");

  var keys = this.keyconfig.service.ps.getChildList(this.keyconfig.profile, {});

  for(i = 0, l = keys.length; i < l; i++) {
   var key, node;
   try {
    key = this.keyconfig.service.ps.getComplexValue(keys[i], Components.interfaces.nsISupportsString).data.split("][");
   } catch(e) { continue; }
   if(key[3] && (!key[4] || key[4] == this.document.location)) {
    node = keyset.appendChild(this.document.createElement("key"));
    node.id = keys[i].substr(this.keyconfig.profile.length);
    node.setAttribute("oncommand",key[3]);
   } else {
    node = this.document.getElementById(keys[i].substr(this.keyconfig.profile.length));
    if(!node) continue;
   }

   node.removeAttribute("modifiers"); node.removeAttribute("key"); node.removeAttribute("keycode");
   node.removeAttribute("charcode"); node.removeAttribute("keytext");
   if(key[0] == "!") {this.keyconfig.removedKeys.appendChild(node); continue;}

   if(key[0]) node.setAttribute("modifiers",key[0]);
   if(key[1]) node.setAttribute("key",key[1]);
   if(key[2]) node.setAttribute("keycode",key[2]);
  }
 },

 Module: function(module) { try { 
  this.js.loadSubScript("chrome://keyconfig/content/" + module + ".js", this);
 } catch(err){} },

 Load: function(path) { try { 
  this.js.loadSubScript(path, this);
 } catch(err){} }

}
