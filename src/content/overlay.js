keyconfig = {
  prefService : Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch(null),
  keys : null,
  aWindow : null,
  loadkeys : function(aWindow){
    this.aWindow = aWindow;

    this.keys = document.getElementsByTagName("key");
    for(var i = 0; i != this.keys.length; i++) if(!this.keys[i].id)
    {
      this.keys[i].id = "xxx_key"+i+"_"+this.keys[i].getAttribute("command")+this.keys[i].getAttribute("oncommand");
    }

    this.keys = this.prefService.getChildList("keyconfig." + aWindow + ".", {});

    for(var i = 0; i != this.keys.length; i++)
    {
      try{ this.key = this.prefService.getCharPref(this.keys[i]).split("]["); }catch(err){continue;}
      aKey = document.getElementById(this.keys[i].split("keyconfig." + aWindow + ".")[1]);
      if(!aKey) continue;

      aKey.setAttribute("modifiers",this.key[0]);
      aKey.setAttribute("key",this.key[1]);
      aKey.setAttribute("keycode",this.key[2]);
    }
  }
}

