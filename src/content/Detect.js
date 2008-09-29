var XULAppInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
var modules = [];

if(!/^(Firefox|Thunderbird|SeaMonkey|Browser)$/.test(XULAppInfo.name)) {
 if(ps.getPrefType("toolkit.defaultChromeURI"))
  ps.setCharPref("keyconfig.UIHook",ps.getCharPref("toolkit.defaultChromeURI"));
 if(XULAppInfo.name == "Songbird")
  ps.setCharPref("keyconfig.UIHook","chrome://songbird/");
 modules.push('Module("UIHook");');
}

eval(modules.join(" "));

ps.deleteBranch("keyconfig.global.");
ps.setCharPref("keyconfig.global.20080929",modules.join(" "));

delete modules;