initInstall("keyconfig", "/dorando/keyconfig/", ""); 

var chromeDir = getFolder("Profile", "chrome");

addFile("keyconfig","chrome/keyconfig.jar",chromeDir,"");
addFile("keyconfig-service","components/keyconfig-service.js",getFolder("Program","components"),"");
addFile("keyconfig-pref","defaults/preferences/keyconfig.js",getFolder("Program","defaults/pref"),"");

registerChrome(PACKAGE | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "content/");
registerChrome(SKIN | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "skin/");

function l(a)
{
  registerChrome(LOCALE | PROFILE_CHROME, getFolder(chromeDir,"keyconfig.jar"), "locale/"+a);
}

l("en-US/");

l("cs-CZ/");
l("de-DE/");
l("es-AR/");
l("fr-FR/");
l("it-IT/");
l("ja-JP/");
l("ru-RU/");
l("sk-SK/");

if (0 == getLastError())
  performInstall();
else
  cancelInstall();