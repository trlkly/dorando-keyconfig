initInstall("undoclosetab", "/dorando/keyconfig/", "20040501"); 

var chromeDir = getFolder("Profile", "chrome");

addFile("keyconfig","keyconfig.jar",chromeDir,"");

registerChrome(PACKAGE | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "content/");
registerChrome(LOCALE | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "locale/en-US/");
registerChrome(SKIN | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "skin/");

if (0 == getLastError())
  performInstall();
else
  cancelInstall();