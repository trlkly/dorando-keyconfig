var gPrefService = null;
var gContent = null;
var gEdit = null;
var gLocaleKeys = null;
var gPlatformKeys = new Object();
var gVKNames = [];
var gReverseNames = true;

function onLoad(){
  gPrefService = window.opener.keyconfig.prefService;
  gContent = document.getElementById("content");
  gEdit = document.getElementById("edit");
  gLocaleKeys = document.getElementById("localeKeys");

  var platformKeys = document.getElementById("platformKeys");
  gPlatformKeys.shift = platformKeys.getString("VK_SHIFT");
  gPlatformKeys.meta  = platformKeys.getString("VK_META");
  gPlatformKeys.alt   = platformKeys.getString("VK_ALT");
  gPlatformKeys.ctrl  = platformKeys.getString("VK_CONTROL");
  gPlatformKeys.sep   = platformKeys.getString("MODIFIER_SEPARATOR");
  switch (gPrefService.getIntPref("ui.key.accelKey")){
    case 17:  gPlatformKeys.accel = gPlatformKeys.ctrl; break;
    case 18:  gPlatformKeys.accel = gPlatformKeys.alt; break;
    case 224: gPlatformKeys.accel = gPlatformKeys.meta; break;
    default:  gPlatformKeys.accel = (window.navigator.platform.search("Mac") == 0 ? gPlatformKeys.meta : gPlatformKeys.ctrl);
  }

  for (var property in KeyEvent) {
    gVKNames[KeyEvent[property]] = property.replace("DOM_","");
  }
  gVKNames[8] = "VK_BACK";

  gReverseNames = (window.navigator.vendor == "Thunderbird") ^ gPrefService.getBoolPref("keyconfig.nicenames.reverse_order");

  keys = window.opener.document.getElementsByTagName("key");

  if(gPrefService.getBoolPref("keyconfig.devmode")){
    this.getFormattedKey = function(a,b,c) {return a+"+"+b+c;}
  }
  if(!gPrefService.getBoolPref("keyconfig.nicenames")){
    this.getNameForId = function(a) {return a;}
  }

  var sortedKeys = [];
  for(var i = 0; i != keys.length; i++) sortedKeys.push(getNameForId(keys[i].id) + "][" + keys[i].id);
  sortedKeys.sort();

  for(key in sortedKeys) {
    var aKey = sortedKeys[key].split("][");
    gContent.appendChild(document.createElement("treeitem"));
    with(gContent.lastChild.appendChild(document.createElement("treerow"))) {
      parentNode.id=aKey[1];
      appendChild(document.createElement("treecell"));
      appendChild(document.createElement("treecell"));
      firstChild.setAttribute("label",aKey[0]);
      lastChild.setAttribute("label",getFormattedKey(
        keys[aKey[1]].getAttribute("modifiers"),
        keys[aKey[1]].getAttribute("key").toUpperCase(),
        keys[aKey[1]].getAttribute("keycode")
      ));
      if(keys[aKey[1]].wasReseted) lastChild.setAttribute("label",messages.onreset);

      if(!(keys[aKey[1]].getAttribute("command") || keys[aKey[1]].getAttribute("oncommand"))) {
        firstChild.setAttribute("properties","disabled");
        lastChild.setAttribute("properties","disabled");
      }
    }
  }
}

function onOK(){
  alert(messages.warn);

  return true;
}

function onSelect(){
  gEdit.value = gContent.childNodes[gContent.parentNode.currentIndex].firstChild.lastChild.getAttribute("label");
  gEdit.keys = null;
}

function getNameForId(aKey){
  var keyUsers = window.opener.document.getElementsByAttribute("key",aKey);
  for(var i = 0; i < keyUsers.length; i++) if(keyUsers[i].label) {
    if(keyUsers[i].parentNode.parentNode.parentNode.localName == "menupopup")
      if(gReverseNames) return keyUsers[i].parentNode.parentNode.getAttribute("label") + " -> " + keyUsers[i].label;
      else return keyUsers[i].label + " [" + keyUsers[i].parentNode.parentNode.getAttribute("label") + "]";

    return keyUsers[i].label;
  }

  aKey = aKey.replace(/xxx_key.+?_/,"");

  if(keyname[aKey]) return getNameForId(keyname[aKey]);

  return aKey;
}

function getFormattedKey(modifiers,key,keycode){
  var val = "";
  if (modifiers) val = modifiers
    .replace(/ $/,"")
    .replace(" ",",")
    .replace(",,",",")
    .replace(",",gPlatformKeys.sep)
    .replace("alt",gPlatformKeys.alt)
    .replace("shift",gPlatformKeys.shift)
    .replace("control",gPlatformKeys.ctrl)
    .replace("meta",gPlatformKeys.meta)
    .replace("accel",gPlatformKeys.accel)
  +gPlatformKeys.sep;
  if (key)
    val += key;
  if(keycode) try {
    val += gLocaleKeys.getString(keycode)
  } catch(e){val += keycode + messages.unrecognized;}

  return val;
}

function Recognize(event){
  event.preventDefault();
  event.stopPropagation();

  var modifiers = [];
  if(event.altKey) modifiers.push("alt");
  if(event.ctrlKey) modifiers.push("control");
  if(event.metaKey) modifiers.push("meta");
  if(event.shiftKey) modifiers.push("shift");

  modifiers = modifiers.join(" ");

  var key = ""; var keycode = "";
  if(event.charCode) key = String.fromCharCode(event.charCode).toUpperCase();
  else keycode = gVKNames[event.keyCode];

  gEdit.value = getFormattedKey(modifiers,key,keycode);
  gEdit.keys = [modifiers,key,keycode];
  gEdit.select();
}

function Apply(){
  if(gContent.parentNode.currentIndex == -1 || !gEdit.keys) return;
  var aKey = keys[gContent.childNodes[gContent.parentNode.currentIndex].id];

  try {
    var key = gPrefService.getCharPref("keyconfig."+window.opener.keyconfig.window+"."+aKey.id).split("][");
    if(key[3]) gEdit.keys.push(key[3]);
  }catch(err){}

  gPrefService.setCharPref("keyconfig."+window.opener.keyconfig.window+"."+aKey.id,gEdit.keys.join("]["));

  gContent.childNodes[gContent.parentNode.currentIndex].firstChild.lastChild.setAttribute("label",gEdit.value);

  aKey.removeAttribute("modifiers"); aKey.removeAttribute("key"); aKey.removeAttribute("keycode");

  if(gEdit.keys[0] == "!") {aKey.removeAttribute("command"); aKey.removeAttribute("oncommand"); return true;}

  if(gEdit.keys[0]) aKey.setAttribute("modifiers",gEdit.keys[0]);
  if(gEdit.keys[1]) aKey.setAttribute("key",gEdit.keys[1]);
  if(gEdit.keys[2]) aKey.setAttribute("keycode",gEdit.keys[2]);

  aKey.wasReseted = false;
  gEdit.keys = null;
}

function Disable(){
  gEdit.value = "";
  gEdit.keys = ["!","",""];
  if(Apply()) gContent.childNodes[gContent.parentNode.currentIndex].firstChild.firstChild.setAttribute("properties","disabled");
  gEdit.keys = null;
}

function Reset(){
  var aKey = keys[gContent.childNodes[gContent.parentNode.currentIndex].id];

  try{
  gPrefService.clearUserPref("keyconfig."+window.opener.keyconfig.window+"."+aKey.id);
  }catch(err){}

  gContent.childNodes[gContent.parentNode.currentIndex].firstChild.lastChild.setAttribute("label",messages.onreset);
  gEdit.value = messages.onreset;
  aKey.wasReseted = true;
}

