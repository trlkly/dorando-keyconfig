initInstall("keyconfig", "/dorando/keyconfig/", ""); 

var chromeDir = getFolder("Profile", "chrome");

addFile("keyconfig","chrome/keyconfig.jar",chromeDir,"");

registerChrome(PACKAGE | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "content/");
registerChrome(LOCALE | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "locale/en-US/");
registerChrome(SKIN | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "skin/");

if (0 == getLastError())
  performInstall();
else
  cancelInstall();