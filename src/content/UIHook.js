var menumanipulator = ps.getChildList("menumanipulator.global.", {})[0];
if(menumanipulator && !ps.getCharPref(menumanipulator).match("chrome://keyconfig/content/menumanipulator.js"))
 ps.setCharPref(menumanipulator,ps.getCharPref(menumanipulator)+' Load("chrome://keyconfig/content/menumanipulator.js");');

if(!document.getElementById("key_keyconfig")) {
 var keyset = this.document.getElementsByTagName("keyset")[0];
 var key = keyset.appendChild(this.document.createElement("key"));
 key.id = "key_keyconfig";
 key.setAttribute("oncommand","openDialog('chrome://keyconfig/content/', '_blank', 'resizable', window);");
 key.setAttribute("modifiers","control shift");
 key.setAttribute("keycode","VK_F12");
}
