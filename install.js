initInstall("keyconfig", "/dorando/keyconfig/", ""); 

var chromeDir = getFolder("Profile", "chrome");

addFile("keyconfig","chrome/keyconfig.jar",chromeDir,"");
addFile("keyconfig-pref","defaults/preferences/keyconfig.js",getFolder("Program","defaults/pref"),"");

registerChrome(PACKAGE | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "content/");
registerChrome(LOCALE | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "locale/en-US/");
registerChrome(LOCALE | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "locale/fr-FR/");
registerChrome(SKIN | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "skin/");

if (0 == getLastError())
  performInstall();
else
  cancelInstall();