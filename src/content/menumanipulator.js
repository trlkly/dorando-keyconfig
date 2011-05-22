if(!document.getElementById("keyconfig") &&
   this.document.location.href.match(this.document.defaultView.keyconfig.service.ps.getCharPref("keyconfig.UIHook"))) {
 New("menuitem","keyconfig");
 Move(
  "id('menu_ToolsPopup') | id('tools-menu')/x:menupopup | //x:menu[@label='Tools']/x:menupopup",0,[
  "id('taskPopup') | id('tasksMenu')/x:menupopup",0,
  "//x:menubar//x:menu/x:menupopup",0,
  "id('contentAreaContextMenu')",0
 ]);
 Set("label","Keyconfig\u2026");
 Set("key","key_keyconfig");
 Set("oncommand","openDialog('chrome://keyconfig/content/', '_blank', 'resizable', window);");

 delete this.node.menumanipulator;
}
