if(!window.extLoad) var extLoad = {
  loaders: [], add: function(index,func){this.loaders.push([index,func])},
  init: function() {
    extLoad.loaders.sort(function(a,b){return a[0]-b[0]});
    for(var loader in extLoad.loaders) extLoad.loaders[loader][1]();
    extLoad.loaders = null;
  }
} window.addEventListener("load", extLoad.init, false);

var keyconfig = {
  prefService: Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch(null),
  keys: null, window : null,
  loadkeys: function(aWindow){
    this.window = aWindow;

    this.keys = document.getElementsByTagName("key");
    for(var i = 0; i < this.keys.length; i++) if(!this.keys[i].id)
      this.keys[i].id = "xxx_key"+i+"_"+this.keys[i].getAttribute("command")+this.keys[i].getAttribute("oncommand");

    this.keys = this.prefService.getChildList("keyconfig." + aWindow + ".", {});

    for(var i = 0; i < this.keys.length; i++) {
      var key;
      try{ key = this.prefService.getCharPref(this.keys[i]).split("]["); }catch(e){continue;}
      if(key[3]) {
        var nKey = document.getElementsByTagName("keyset")[0].appendChild(document.createElement("key"));
        nKey.id=this.keys[i].split("keyconfig." + aWindow + ".")[1];
        nKey.setAttribute("oncommand",key[3]);
      }

      var aKey = document.getElementById(this.keys[i].split("keyconfig." + aWindow + ".")[1]);
      if(!aKey) continue;

      aKey.removeAttribute("modifiers"); aKey.removeAttribute("key"); aKey.removeAttribute("keycode");
      if(key[0] == "!") {aKey.removeAttribute("command"); aKey.removeAttribute("oncommand"); continue;}

      if(key[0]) aKey.setAttribute("modifiers",key[0]);
      if(key[1]) aKey.setAttribute("key",key[1]);
      if(key[2]) aKey.setAttribute("keycode",key[2]);
    }
  }
}