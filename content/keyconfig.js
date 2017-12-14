var gPrefService = Components.classes['@mozilla.org/preferences-service;1']
                   .getService(Components.interfaces.nsIPrefService).getBranch("");
var gUnicodeConverter = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
                                  .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                                 .getService(Components.interfaces.nsIClipboardHelper);
var WindowMediator = Components.classes['@mozilla.org/appshell/window-mediator;1']
                               .getService(Components.interfaces.nsIWindowMediator);

var gDocument, gLocation, gProfile, gKeys, gUsedKeys, gRemovedKeys;

var gExtra2, keyTree, gEditbox, gEdit;

var gLocaleKeys;
var gPlatformKeys = new Object();
var gVKNames = [];
var gReverseNames;

function onLoad() {
 gUnicodeConverter.charset = "UTF-8";

 gExtra2 = document.documentElement.getButton("extra2");
 keyTree = document.getElementById("key-tree");
 gEditbox = document.getElementById("editbox");
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

 var XULAppInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
 var isThunderbird = XULAppInfo.name == "Thunderbird";

 gReverseNames = isThunderbird ^ gPrefService.getBoolPref("extensions.dorandoKeyConfig.nicenames.reverse_order");

 if(gPrefService.getBoolPref("extensions.dorandoKeyConfig.devmode")){ this.getFormattedKey = function(a,b,c) {return (a+"+"+b+c).replace(/null/g,"");} }

 var target = window.arguments ? window.arguments[0] : WindowMediator.getEnumerator(null).getNext();

 var windowList = document.getElementById("window-list");
 var i, l;
 for(i = 0, l = windowList.firstChild.childNodes.length; i < l; i++)
  if(windowList.firstChild.childNodes[i].label == target.document.title)
   windowList.selectedIndex = i;

 init(target);

 windowList.focus();
}

function init(target) {
 if(!target) return;

 gDocument = target.document;
 gLocation = gDocument.location.href;
 gProfile = target.keyconfig.profile;

 gKeys = [];
 gRemovedKeys = target.keyconfig.removedKeys;

 var hideDisabled = gPrefService.getBoolPref("extensions.dorandoKeyConfig.hideDisabled");

 var keys = gDocument.getElementsByTagName("key");
 for(var i = 0, l = keys.length; i < l; i++) {
  var key = new Key(keys[i]);
  if(!(hideDisabled && key.disabled))
   gKeys.push(key);
 }

 detectUsedKeys();

 var elem = keyTree.getElementsByAttribute("sortActive","true")[0] || document.getElementById("name");

 gKeys.sort(sorter[elem.id]);
 if(elem.getAttribute("sortDirection") == "descending") gKeys.reverse();

 keyTree.view = keyView;
 keyTree.view.selection.select(-1);

 gExtra2.label = gStrings.add;
 gEditbox.setAttribute("disabled","true");
 gEdit.value = "";
 gEdit.keys = ["!",null,null];
}

function onOK() { }

function getFormattedKey(modifiers,key,keycode) {
 if(modifiers == "shift,alt,control,accel" && keycode == "VK_SCROLL_LOCK") return gStrings.disabled;
 if(!key && !keycode) return gStrings.disabled;

 var val = "";
 if(modifiers) val = modifiers
  .replace(/^[\s,]+|[\s,]+$/g,"").split(/[\s,]+/g).join(gPlatformKeys.sep)
  .replace("alt",gPlatformKeys.alt)
  .replace("shift",gPlatformKeys.shift)
  .replace("control",gPlatformKeys.ctrl)
  .replace("meta",gPlatformKeys.meta)
  .replace("accel",gPlatformKeys.accel)
  +gPlatformKeys.sep;
 if(key == " ") {
  key = ""; keycode = "VK_SPACE";
 }
 if(key)
  val += key;
 if(keycode) try {
  val += gLocaleKeys.getString(keycode)
 } catch(e){val += gStrings.unrecognized.replace("$1",keycode);}

 return val;
}

function getNameForKey(aKey) {
 var val;

 if(aKey.hasAttribute("label")) return aKey.getAttribute("label");

 if(aKey.hasAttribute("command") || aKey.hasAttribute("observes")) {
  var command = aKey.getAttribute("command") || aKey.getAttribute("observes");
  var node = gDocument.getElementById(command);
  if(node && node.hasAttribute("label")) return node.getAttribute("label");
  val = getLabel("command", command);
  if(!val) val = getLabel("observes", command);
 }

 if(!val) val = getLabel("key", aKey.id);

 if(val) return val;

 var id = aKey.id.replace(/xxx_key.+?_/,"");
 try {id = gUnicodeConverter.ConvertToUnicode(id);} catch(err) { gUnicodeConverter.charset = "UTF-8"; }

 if(keyname[id]) {
  var key = gDocument.getElementById(keyname[id]);
  if(key) return getNameForKey(key);
  return keyname[id];
 }

 return id;
}

function getLabel(attr, value) {
 var Users = gDocument.getElementsByAttribute(attr,value);
 var User;

 for(var i = 0, l = Users.length; i < l; i++)
  if(Users[i].hasAttribute("label") && (!User || User.localName == "menuitem")) User = Users[i];

 if(!User) return null;

 if(User.localName == "menuitem" && User.parentNode.parentNode.parentNode.localName == "menupopup") {
  if(gReverseNames) return User.parentNode.parentNode.getAttribute("label") + " > " + User.getAttribute("label");
  else return User.getAttribute("label") + " [" + User.parentNode.parentNode.getAttribute("label") + "]";
 } else return User.getAttribute("label");
}

function Recognize(event) {
 event.preventDefault();
 event.stopPropagation();

 var modifiers = [];
 if(event.altKey) modifiers.push("alt");
 if(event.ctrlKey) modifiers.push("control");
 if(event.metaKey) modifiers.push("meta");
 if(event.shiftKey) modifiers.push("shift");

 modifiers = modifiers.join(" ");

 var key = null; var keycode = null;
 if(event.charCode) key = String.fromCharCode(event.charCode).toUpperCase();
 else { keycode = gVKNames[event.keyCode]; if(!keycode) return;}

 gEdit.value = getFormattedKey(modifiers,key,keycode);
 gEdit.keys = [modifiers,key,keycode];

 if(!(gPrefService.getBoolPref("extensions.dorandoKeyConfig.allowAltCodes") && modifiers == "alt" && key && !isNaN(key))) {
  if(gPrefService.getBoolPref("extensions.dorandoKeyConfig.warnOnDuplicate") && gEdit.value != gEdit.key.shortcut && gUsedKeys[gEdit.value])
   window.setTimeout(function(){ window.alert(gStrings.used.replace("$1",gUsedKeys[gEdit.value].join("\n"))) },0);

   gEdit.nextSibling.focus();
 }
}

function Apply() {
 var key = gKeys[keyTree.currentIndex];

 keyTree.focus();

 if(key.shortcut == gEdit.value) return;

 key.shortcut = gEdit.value;
 key.pref.splice(0,3,gEdit.keys[0],gEdit.keys[1],gEdit.keys[2]);

 detectUsedKeys();

 var value = key.pref.join("][");
 try {
     // Gecko 58+
     gPrefService.setStringPref(gProfile+key.id, value);
 }
 catch (e) {
     var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
     str.data = value;
     gPrefService.setComplexValue(gProfile+key.id, Components.interfaces.nsISupportsString, str);
 }

 keyTree.treeBoxObject.invalidate();

 var targets = WindowMediator.getEnumerator(null);
 var target;
 while(target = targets.getNext()) {
  if(key.pref[4] && target.location != key.pref[4])
   continue;

  var node = target.document.getElementById(key.id);
  if(node) {
   node.removeAttribute("modifiers"); node.removeAttribute("key"); node.removeAttribute("keycode");
   node.removeAttribute("charcode"); node.removeAttribute("keytext");
   node.removeAttribute("keyconfig");

   var keyset = null;

   if(key.pref[0] == "!") {
    keyset = node.parentNode;
    target.keyconfig.removedKeys.appendChild(node);
   } else {
    if(key.pref[0]) node.setAttribute("modifiers",key.pref[0]);
    if(key.pref[1]) node.setAttribute("key",key.pref[1]);
    if(key.pref[2]) node.setAttribute("keycode",key.pref[2]);

    if(node.parentNode.localName != "keyset")
     target.document.getElementsByTagName("keyset")[0].appendChild(node);
   }

   keyset = keyset || node.parentNode;
   while(keyset.parentNode && keyset.parentNode.localName == "keyset")
    keyset = keyset.parentNode;
   keyset.parentNode.insertBefore(keyset, keyset.nextSibling);

   var menuitems = target.document.getElementsByAttribute("key",key.id);
   for(var i = 0, l = menuitems.length; i < l; i++) {
    menuitems[i].setAttribute("acceltext","");
    menuitems[i].removeAttribute("acceltext");
   }
  }
 }
}

function Disable() {
 gEdit.value = gStrings.disabled;
 gEdit.keys = ["!",null,null];
 Apply();
}

function Reset() {
 var key = gKeys[keyTree.currentIndex];

 try{ gPrefService.clearUserPref(gProfile+key.id); } catch(err) {}

 key.pref = [];
 key.shortcut = gEdit.value = gStrings.uponreset;
 gEdit.keys = ["!",null,null];

 gExtra2.label = gStrings.add;

 var targets = WindowMediator.getEnumerator(null);
 var target;
 while(target = targets.getNext()) {
  var node = target.document.getElementById(key.id);
  if(node)
   node.setAttribute("keyconfig","resetted"); 
 }

 detectUsedKeys();

 keyTree.treeBoxObject.invalidate();
 keyTree.focus();
}

function Key(aKey) {
 this.name = getNameForKey(aKey);
 this.shortcut = getFormattedKey(
  aKey.hasAttribute("modifiers") ? aKey.getAttribute("modifiers") : null,
  aKey.hasAttribute("keytext") ? aKey.getAttribute("keytext") :
  aKey.hasAttribute("key") ? aKey.getAttribute("key").toUpperCase() : aKey.hasAttribute("charcode") ? aKey.getAttribute("charcode").toUpperCase() : null,
  aKey.hasAttribute("keycode") ? aKey.getAttribute("keycode") : null
 );
 this.id = aKey.id;
 if(aKey.getAttribute("keyconfig") == "resetted") this.shortcut = gStrings.uponreset;

 try {
     try {
         // Gecko 58+
         this.pref = gPrefService.getStringPref(gProfile+aKey.id).split("][");
     }
     catch (e) {
         this.pref = gPrefService.getComplexValue(gProfile+aKey.id, Components.interfaces.nsISupportsString).data.split("][");
     }
 } catch(err) { this.pref = []; }

 this.code = getCodeFor(aKey);
 if(this.code == null) this.hardcoded = true;
}
Key.prototype = {
 get disabled() { return this.shortcut == gStrings.disabled; }
}

var sorter = {
 name: function(a,b) { return a.name.localeCompare(b.name); },
 id: function(a,b) { return a.id.localeCompare(b.id); },
 shortcut: function(a,b) {
  if(a.shortcut == b.shortcut) return 0;
  if(!a.shortcut) return 1;
  if(!b.shortcut) return -1;
  if(a.shortcut > b.shortcut) return 1;
  return -1;
 }
}

function detectUsedKeys() {
 gUsedKeys = [];

 for(var i = 0, l = gKeys.length; i < l; i++) {
  if(gUsedKeys[gKeys[i].shortcut])
   gUsedKeys[gKeys[i].shortcut].push(gKeys[i].name);
  else
   gUsedKeys[gKeys[i].shortcut]=[gKeys[i].name];
 }

 gUsedKeys[gStrings.disabled] = gUsedKeys[gStrings.uponreset] = {length: 0}
}

function openEditor(type) {
 var key, code;
 switch(type) {
  case 1:
   key = gKeys[keyTree.currentIndex];
   break;
  case 2:
   key = gKeys[keyTree.currentIndex];
   if(key && !key.pref[3]) code = key.code;
   break;
 }

 openDialog('chrome://keyconfig/content/edit.xul', '_blank', 'resizable,modal', key, code, this);
}

function closeEditor(fields) {
 var key;

 if(fields.key) {
  key = fields.key;
  gPrefService.clearUserPref(gProfile+key.id);
 } else {
  key = { shortcut: gStrings.disabled, pref: ["!",null,null," "] }
  gKeys.push(key);

  keyTree.treeBoxObject.rowCountChanged(keyTree.view.rowCount-1,1);
  keyTree.view.selection.select(keyTree.view.rowCount-1);
  keyTree.treeBoxObject.ensureRowIsVisible(keyTree.view.rowCount-1);
  gEdit.focus();
 }

 var currentId = key.id;

 if(key.name != fields.name.value) try {
  key.name = fields.name.value || "key"+Date.now();

  var i = 1;
  do {
   key.id = "xxx_key"+(i++)+"_" + gUnicodeConverter.ConvertFromUnicode(key.name);
  } while(gPrefService.prefHasUserValue(gProfile+key.id));
 } catch(err){ gUnicodeConverter.charset = "UTF-8"; key.id = "key"+Date.now(); }
 
 key.code = key.pref[3] = fields.code.value.replace(/]\[/g,"] [") || " ";

 key.pref[4] = fields.global.checked ? "" : gLocation;

 var value = key.pref.join("][");
 try {
     // Gecko 58+
     gPrefService.setStringPref(gProfile+key.id, value);
 }
 catch (e) {
     var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
     str.data = value;
     gPrefService.setComplexValue(gProfile+key.id, Components.interfaces.nsISupportsString, str);
 }

 var targets = WindowMediator.getEnumerator(null);
 var target;
 while(target = targets.getNext()) {
  if(key.pref[4] && target.location != key.pref[4])
   continue;

  var node = target.document.getElementById(currentId);
  if(!node)
   node = target.keyconfig.removedKeys.appendChild(target.document.createElement("key"));

  node.id = key.id;
  //node.addEventListener("command",key.code);
     node.setAttribute("oncommand",key.code);

 }

 keyTree.treeBoxObject.invalidateRow(keyTree.currentIndex);
}

var keyView = {
 get rowCount() { return gKeys.length; },
 getCellText : function(row,col){ return gKeys[row][col.id || col];},
 setTree: function(treebox) { this.treebox=treebox; },
 isContainer: function() { return false; },
 isSeparator: function() { return false; },
 isSorted: function() { return false; },
 getLevel: function() { return 0; },
 getImageSrc: function() { return null; },
 getRowProperties: function(row, prop) { this.getCellProperties(row, "", prop); },
 canDropBeforeAfter: function() { return false; },
 canDrop: function() { return false; },
 getParentIndex: function() { return -1; },

getCellProperties: function(row,col) {
 var key = gKeys[row];
// try { console.log ( key + " " + key.shortcut ) } catch(e) {};
//try { if (key.shortcut ) return "reset"; } catch(e) {console.log(e)}
 if(key.hardcoded) return "hardcoded";
 if(key.disabled) return "disabled";
 if(key.pref[3]) return "custom";
 if(key.pref.length) return "user";
 if((col.id || col) == "shortcut" && gUsedKeys[key.shortcut].length > 1)
  return "duplicate";
 return "";
},
 getColumnProperties: function(){},
 selectionChanged: function() {
  var key = gKeys[this.selection.currentIndex];

  if(!key) return;

  gExtra2.label = key.pref[3] ? gStrings.edit : gStrings.add;
  if(gEditbox.hasAttribute("disabled")) gEditbox.removeAttribute("disabled");
  gEdit.key = key;
  gEdit.value = key.shortcut;
 },
 cycleHeader: function cycleHeader(col, elem) {
  if(col.id) elem = col.element;

  var direction = elem.getAttribute("sortDirection") == "ascending" ? "descending" : "ascending";
  var columns = this.treebox.firstChild.childNodes;
  for(var i = 0, l = columns.length; i < l; i++) {
   columns[i].setAttribute("sortDirection","none");
   columns[i].setAttribute("sortActive",false);
  }

  elem.setAttribute("sortDirection",direction);
  elem.setAttribute("sortActive",true);

  var currentRow = gKeys[this.selection.currentIndex];

  gKeys.sort(sorter[col.id || col]);
  if(direction == "descending") gKeys.reverse();

  this.treebox.invalidate();
  if(currentRow) {
   i = -1;
   do { i++; } while(currentRow != gKeys[i]);
   this.selection.select(i);
   this.treebox.ensureRowIsVisible(i);
  }
 }
}

function switchWindow(event) {
 var mediator = Components.classes["@mozilla.org/rdf/datasource;1?name=window-mediator"].getService();
 mediator.QueryInterface(Components.interfaces.nsIWindowDataSource);

 var target = mediator.getWindowForResource(event.target.getAttribute('id'));

 if (target) init(target);
}

function getCodeFor(node) {
 if(node.hasAttribute("oncommand")) {
  return node.getAttribute("oncommand");
 } else if(node.hasAttribute("command")) {
  var command = gDocument.getElementById(node.getAttribute("command"));
  if(command) return command.getAttribute("oncommand");
 } else if(node.hasAttribute("observes")) {
  var observer = gDocument.getElementById(node.getAttribute("observes"));
  if(observer) return command.getAttribute("oncommand");
 }
 return null;
}

function copyKey() {
 var key = gKeys[keyTree.currentIndex];
 if(!key) return;

 var data = 'name: ' + key.name + ', id: ' + key.id + ', shortcut: ' + key.shortcut + ', code:\n' + key.code;
 
 gClipboardHelper.copyString(data);
}
