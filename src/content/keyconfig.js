var gPrefService = window.opener.keyconfig.prefService;
var gAtomService = Components.classes["@mozilla.org/atom-service;1"].getService(Components.interfaces.nsIAtomService);
var gProfile = window.opener.keyconfig.profile;
var gDocument = window.opener.document;
var gRemovedKeys = window.opener.keyconfig.removedKeys;

var gExtra2, gTree, gEditbox, gEdit;

var gKeys = [];
var gUsedKeys = [];

var gLocaleKeys;
var gPlatformKeys = new Object();
var gVKNames = [];
var gReverseNames = true;

function onLoad(){
  gExtra2 = document.documentElement.getButton("extra2");
  gTree = document.getElementById("key-tree");
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

  gReverseNames = (window.navigator.vendor == "Thunderbird") ^ gPrefService.getBoolPref("keyconfig.nicenames.reverse_order");

  if(gPrefService.getBoolPref("keyconfig.devmode")){ this.getFormattedKey = function(a,b,c) {return a+"+"+b+c;} }
  if(!gPrefService.getBoolPref("keyconfig.nicenames")){ this.getNameForKey = function(a) {return a.id;} }

  setupTree();
}

function onOK() { if(gPrefService.getBoolPref("keyconfig.warnOnClose")) alert(messages.warn); }

function getFormattedKey(modifiers,key,keycode) {
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
  } catch(e){val += messages.unrecognized.replace("$1",keycode);}

  return val;
}

function getNameForKey(aKey) {
  var val;

  if(aKey.hasAttribute("label")) return aKey.getAttribute("label");

  if(aKey.hasAttribute("command")) {
    var command = aKey.getAttribute("command");
    var node = gDocument.getElementById(command);
    if(node && node.hasAttribute("label")) return node.getAttribute("label");
    val = getLabel("command", command);
  }

  if(!val) val = getLabel("key", aKey.id);

  if(val) return val;

  var id = aKey.id.replace(/xxx_key.+?_/,"");

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
    if(Users[i].localName != "key" && (!User || User.localName == "menuitem")) User = Users[i];

  if(!User) return null;

  if(User.localName == "menuitem" && User.parentNode.parentNode.parentNode.localName == "menupopup") {
    if(gReverseNames) return User.parentNode.parentNode.getAttribute("label") + " -> " + User.getAttribute("label");
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

  var key = ""; var keycode = "";
  if(event.charCode) key = String.fromCharCode(event.charCode).toUpperCase();
  else { keycode = gVKNames[event.keyCode]; if(!keycode) return;}

  gEdit.value = getFormattedKey(modifiers,key,keycode);
  gEdit.keys = [modifiers,key,keycode];

  if(gPrefService.getBoolPref("keyconfig.warnOnDuplicate") && gEdit.value != gEdit.key.shortcut && gUsedKeys[gEdit.value])
    alert(messages.used.replace("$1",gUsedKeys[gEdit.value].join("\n")));

  gEdit.select();
}

function Apply() {
  var key = gKeys[gTree.currentIndex];
  var node = key.node;

  if(key.shortcut == gEdit.value) return;

  key.shortcut = gEdit.value;
  key.pref.splice(0,3,gEdit.keys[0],gEdit.keys[1],gEdit.keys[2]);

  detectUsedKeys();

  gPrefService.setCharPref(gProfile+node.id,key.pref.join("]["));

  node.removeAttribute("modifiers"); node.removeAttribute("key"); node.removeAttribute("keycode"); node.wasReseted = false;

  if(key.pref[0] == "!") gRemovedKeys.appendChild(node);

  if(key.pref[0] && key.pref[0] != "!") node.setAttribute("modifiers",key.pref[0]);
  if(key.pref[1]) node.setAttribute("key",key.pref[1]);
  if(key.pref[2]) node.setAttribute("keycode",key.pref[2]);

  gTree.treeBoxObject.invalidate();
}

function Disable() {
  gEdit.value = "";
  gEdit.keys = ["!","",""];
  Apply();
}

function Reset() {
  var key = gKeys[gTree.currentIndex];
  var node = key.node;

  try{ gPrefService.clearUserPref(gProfile+node.id); }catch(err){}

  key.pref = [];
  key.shortcut = gEdit.value = messages.onreset;

  gExtra2.label = messages.add;
  node.wasReseted = true;
  detectUsedKeys();

  gTree.treeBoxObject.invalidate();
}

function Key(aKey) {
  this.node = aKey;
  this.name = getNameForKey(aKey);
  this.shortcut = getFormattedKey(
    aKey.getAttribute("modifiers"),
    aKey.getAttribute("key").toUpperCase(),
    aKey.getAttribute("keycode")
  );
  if(aKey.wasReseted) this.shortcut = messages.onreset;

  try {
    this.pref = gPrefService.getCharPref(gProfile+aKey.id).split("][");
  } catch(err) { this.pref = []; }

  if(!aKey.hasAttribute("command") && !aKey.hasAttribute("oncommand")) this.hardcoded = true;
}

var sorter = {
  name: function(a,b) {
    if(a.name == b.name) return 0;
    if(a.name > b.name) return 1;
    return -1;
  },
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

  gUsedKeys[""] = gUsedKeys[messages.onreset] = {length: 0}

}

function openEditor() { openDialog('chrome://keyconfig/content/edit.xul', 'keyconfig-edit', 'resizable,modal'); }

function closeEditor(fields) {
  var key;

  if(fields.key) {
    key = fields.key;
    gPrefService.clearUserPref(gProfile+key.node.id);
  } else {
    key = {node: document.createElement("key"), shortcut: "", pref: ["!",,," ",gDocument.location]}
    gKeys.push(key);
    gDocument.getElementsByTagName("keyset")[0].appendChild(key.node);
    gTree.treeBoxObject.rowCountChanged(gTree.view.rowCount-1,1);
    gTree.view.selection.select(gTree.view.rowCount-1);
    gTree.treeBoxObject.ensureRowIsVisible(gTree.view.rowCount-1);
  }

  key.name = fields.name.value;
  key.node.id = "xxx_key__" + key.name;
  key.node.setAttribute("oncommand",fields.code.value || " ");
  key.pref[3] = fields.code.value || " ";

  gPrefService.setCharPref(gProfile+key.node.id,key.pref.join("]["));

  gTree.treeBoxObject.invalidateRow(gTree.currentIndex);
}

function setupTree() {
  gDocument.documentElement.appendChild(gRemovedKeys);
  var keys = gDocument.getElementsByTagName("key");
  for(var i = 0, l = keys.length; i < l; i++) gKeys.push(new Key(keys[i]));
  gDocument.documentElement.removeChild(gRemovedKeys);

  detectUsedKeys();

  var elem = gTree.getElementsByAttribute("sortActive","true")[0];

  gKeys.sort(sorter[elem.id]);
  if(elem.getAttribute("sortDirection") == "descending") gKeys.reverse();

  gTree.view=treeView;
}

var treeView = {
  get rowCount() { return gKeys.length; },
  getCellText : function(row,col){ return gKeys[row][col.id || col];},
  setTree: function(treebox) { this.treebox=treebox; },
  isContainer: function() { return false; },
  isSeparator: function() { return false; },
  isSorted: function() { return false; },
  getLevel: function() { return 0; },
  getImageSrc: function() { return null; },
  getRowProperties: function() {},
  getCellProperties: function(row,col,props) {
    var key = gKeys[row];
    if(key.hardcoded) props.AppendElement(gAtomService.getAtom("hardcoded"));
    if(key.pref[0] == "!") props.AppendElement(gAtomService.getAtom("disabled"));
    if(key.pref[3]) props.AppendElement(gAtomService.getAtom("custom"));
    if(key.pref.length) props.AppendElement(gAtomService.getAtom("user"));
    if((col.id || col) == "shortcut" && gUsedKeys[key.shortcut].length > 1)
      props.AppendElement(gAtomService.getAtom("duplicate"));
  },
  getColumnProperties: function(){},
  selectionChanged: function(){
    gExtra2.label = gKeys[gTree.currentIndex].pref[3] ? messages.edit : messages.add;
    if(gEditbox.hasAttribute("disabled")) gEditbox.removeAttribute("disabled");
    gEdit.key = gKeys[gTree.currentIndex];
    gEdit.value = this.getCellText(gTree.currentIndex,"shortcut");
  },
  cycleHeader: function cycleHeader(col, elem) {
    if(col.id) elem = col.element;

    var direction = elem.getAttribute("sortDirection") == "ascending" ? "descending" : "ascending";
    var columns = gTree.getElementsByTagName("treecol");
    for(var i = 0, l = columns.length; i < l; i++) {
      columns[i].setAttribute("sortDirection","none");
      columns[i].setAttribute("sortActive",false);
    }

    elem.setAttribute("sortDirection",direction);
    elem.setAttribute("sortActive",true);

    var currentRow = gKeys[gTree.currentIndex];

    gKeys.sort(sorter[col.id || col]);
    if(direction == "descending") gKeys.reverse();

    gTree.treeBoxObject.invalidate();
    if(currentRow) {
      i = -1;
      do { i++; } while(currentRow != gKeys[i]);
      this.selection.select(i);
      gTree.treeBoxObject.ensureRowIsVisible(i);
    }
  }
}