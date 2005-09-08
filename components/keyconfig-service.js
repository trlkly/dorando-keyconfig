function NSGetModule(compMgr, fileSpec) { return keyconfigModule; }

var keyconfigModule = {
  CID: Components.ID("{e9f7950e-d78d-4aaa-900a-c43588052eba}"),
  contractID : "@dorando.at/keyconfig;1",
  className  : "keyconfigService",

  registerSelf: function (aComponentManager, aFileSpec, aLocation, aType) 
  {
    aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);

    aComponentManager.registerFactoryLocation(this.CID, this.className, this.contractID, aFileSpec, aLocation, aType);

    var CategoryManager = Components.classes["@mozilla.org/categorymanager;1"]
                                    .getService(Components.interfaces.nsICategoryManager);
    CategoryManager.addCategoryEntry("app-startup", this.className, "service," + this.contractID, true, true, null);
  },
  
  getClassObject: function (aComponentManager, aCID, aIID) 
  {
    if (!aIID.equals(Components.interfaces.nsIFactory)) throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(this.CID)) return this.factory;
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  factory: {
    createInstance: function (aOuter, aIID)
    {
      if (aOuter != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

      return new keyconfigService();
    }
  },
  
  canUnload: function () { return true; }
};

function keyconfigService() { }

keyconfigService.prototype = {
  os: Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService),
  ps: Components.classes['@mozilla.org/preferences-service;1']
                .getService(Components.interfaces.nsIPrefService).getBranch(""),
  bug174320fixed: Components.interfaces.nsIDOMNSFeatureFactory ? true : false,
  haspageshow: Components.interfaces.nsIDOMPageTransitionEvent ? true : false,

  observe: function (aSubject, aTopic, aData) {
    if(aTopic == "app-startup") this.os.addObserver(this,"domwindowopened",false);
    else if(aTopic == "domwindowopened") {
      aSubject.keyconfig = {service: this};
      aSubject.addEventListener("load",this.load,this.bug174320fixed);
    }
  },

  load: function(event) {
    this.removeEventListener(event.type,this.keyconfig.service.load,true);

    if(event.eventPhase == 2 && this.keyconfig.service.bug174320fixed)
     if(this.keyconfig.service.haspageshow)
      this.addEventListener("pageshow",this.keyconfig.service.init,false);
     else
      this.keyconfig.service.init.call(this);
    else
      this.addEventListener("load",this.keyconfig.service.init,false);
  },

  init: function() {
    this.keyconfig.removedKeys = this.document.createElement("keyset");
    this.keyconfig.profile = "keyconfig." + this.keyconfig.service.ps.getCharPref("keyconfig.profile") + ".";

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
      node.removeAttribute("charcode");
      if(key[0] == "!") {this.keyconfig.removedKeys.appendChild(node); continue;}

      if(key[0]) node.setAttribute("modifiers",key[0]);
      if(key[1]) node.setAttribute("key",key[1]);
      if(key[2]) node.setAttribute("keycode",key[2]);
    }
  }

}
