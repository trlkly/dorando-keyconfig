Components.utils.import("chrome://keyconfig/content/defaultPreferencesLoader.jsm");

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
  // Current Thunderbird nightly builds do not load default preferences
  // from overlay add-ons. They're probably going to fix this, but it may go
  // away again at some point in the future, and in any case we'll need to do
  // it ourselves when we convert from overlay to bootstrapped, and there
  // shouldn't be any harm in setting the default values of preferences twice
  // (i.e., both Thunderbird and our code doing it).
  // This is in a try/catch because if it fails it's probably because
  // setStringPref failed, in which case we're running inside an earlier
  // application version which has already loaded the default preferences
  // automatically.
  try {
      var loader = new DefaultPreferencesLoader();
      loader.parseUri(
          "chrome://keyconfig-defaults/content/preferences/keyconfig.js");
  } catch (ex) {}

  if(event && event.eventPhase != 2) return;

  this.removeEventListener("pageshow",this.keyconfig.service.init,false);

  this.keyconfig.removedKeys = this.document.documentElement.appendChild(this.document.createElement("keyconfig"));

 
  if (this.keyconfig.service.ps.prefHasUserValue("keyconfig.global.20110522")) {
    var oldBranch = "keyconfig."; var newBranch = "extensions.dorandoKeyConfig.";
    var oldKeys = this.keyconfig.service.ps.getChildList(oldBranch)
    for (var i = 0; i < oldKeys.length; i++) {
      var newKey = newBranch + oldKeys[i].split(oldBranch)[1];
      switch (this.keyconfig.service.ps.getPrefType(oldKeys[i])) {
        case 32: //PREF_STRING
          var value = this.keyconfig.service.ps.getCharPref(oldKeys[i]);
          this.keyconfig.service.ps.setCharPref(newKey, value);
          break;

        case 64: //PREF_INT
          var value = this.keyconfig.service.ps.getIntPref(oldKeys[i]);
          this.keyconfig.service.ps.setIntPref(newKey, value);
          break;
        
        case 128: //PREF_BOOLEAN
          var value = this.keyconfig.service.ps.getBoolPref(oldKeys[i]);
          this.keyconfig.service.ps.setBoolPref(newKey, value);
          break;
      }
    }
    this.keyconfig.service.ps.deleteBranch(oldBranch); 
  }
  
  this.keyconfig.service.ps.deleteBranch("extensions.dorandoKeyConfig.global")
  
  this.keyconfig.profile = "extensions.dorandoKeyConfig." + this.keyconfig.service.ps.getCharPref("extensions.dorandoKeyConfig.profile") + ".";

  var i, l;

  var keyset = this.document.getElementsByTagName("keyset")[0] ||
               this.document.documentElement.appendChild(this.document.createElement("keyset"));

  var nodes = this.document.getElementsByTagName("key");
  for(i = 0, l = nodes.length; i < l; i++) if(!nodes[i].id)
   nodes[i].id = "xxx_key"+ i +"_"+nodes[i].getAttribute("command")+nodes[i].getAttribute("oncommand");

  var keys = this.keyconfig.service.ps.getChildList(this.keyconfig.profile, {});

  for(i = 0, l = keys.length; i < l; i++) {
   var key, node;
   try {
       try {
           // Gecko 58+
           key = this.keyconfig.service.ps.getStringPref(keys[i]).split("][");
       }
       catch (e) {
           key = this.keyconfig.service.ps.getComplexValue(keys[i], Components.interfaces.nsISupportsString).data.split("][");
       }
   } catch(e) { continue; }
   if(key[3] && (!key[4] || key[4] == this.document.location)) {
    node = keyset.appendChild(this.document.createElement("key"));
    node.id = keys[i].substr(this.keyconfig.profile.length);
//    node.addEventListener("command",key[3]);
    node.setAttribute("oncommand",key[3])
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
