function onLoad()
{
  content = document.getElementById("content");
  idcol = (content.parentNode.columns ? content.parentNode.columns["id"] : "id");
  keys = window.opener.document.getElementsByTagName("key");
  useNames = window.opener.keyconfig.prefService.getBoolPref("keyconfig.nicenames");

  var sortedKeys = [];
  if(useNames) for(var i = 0; i != keys.length; i++)
    sortedKeys.push(getNameForId(keys[i].id) + "][" + keys[i].id);
  else for(var i = 0; i != keys.length; i++)
    sortedKeys.push(keys[i].id + "][" + keys[i].id);

  sortedKeys.sort();

  for(key in sortedKeys)
  {
    var aKey = sortedKeys[key].split("][");
    content.appendChild(document.createElement("treeitem"));
    with(content.lastChild.appendChild(document.createElement("treerow")))
    {
      parentNode.id=aKey[1];
      appendChild(document.createElement("treecell"));
      appendChild(document.createElement("treecell"));
      childNodes[0].setAttribute("label",aKey[0]);
      childNodes[1].setAttribute("label",
        (keys[aKey[1]].hasAttribute("modifiers") ? keys[aKey[1]].getAttribute("modifiers").replace(",","+").replace(" ","+")+"+" : "")+
        keys[aKey[1]].getAttribute("key").toUpperCase()+
        keys[aKey[1]].getAttribute("keycode")
      );
      if(!(keys[aKey[1]].getAttribute("command") || keys[aKey[1]].getAttribute("oncommand")))
      {
        childNodes[0].setAttribute("properties","disabled");
        childNodes[1].setAttribute("properties","disabled");
      }
    }
  }

  document.getElementById("edit").childNodes[0].value="";
  document.getElementById("edit").childNodes[1].value="";
}

function onOK()
{
  alert(messages.warn);

  return true;
}

function onSelect()
{
  var aKey = keys[content.parentNode.treeBoxObject.treeBody.childNodes[content.parentNode.view.selection.currentIndex].id];
  with(document.getElementById("edit"))
  {
    childNodes[0].value=aKey.getAttribute("modifiers").replace(",","+").replace(" ","+").replace("++","+");
    childNodes[1].value=aKey.getAttribute("key").toUpperCase()+aKey.getAttribute("keycode");
  }
}

function onApply()
{
  if(content.parentNode.view.selection.currentIndex == -1)return;

  var aKey = keys[content.parentNode.treeBoxObject.treeBody.childNodes[content.parentNode.view.selection.currentIndex].id];

  with(document.getElementById("edit"))
  {

    window.opener.keyconfig.prefService.setCharPref("keyconfig."+window.opener.keyconfig.aWindow+"."+aKey.id,
      childNodes[0].value.replace("+",",")+"]["+
      (childNodes[1].value.length == 1 ? childNodes[1].value + "][" : "]["+ childNodes[1].value)
    );

    content.childNodes[content.parentNode.view.selection.currentIndex].childNodes[0].childNodes[1].setAttribute("label",
      (childNodes[0].value ? childNodes[0].value+"+" : "")+
      childNodes[1].value
    );

    if (childNodes[0].value) aKey.setAttribute("modifiers",childNodes[0].value.replace("+",","));
      else aKey.removeAttribute("modifiers");
    if (childNodes[1].value.length == 1) aKey.setAttribute("key",childNodes[1].value);
    else if (childNodes[1].value.length > 1) aKey.setAttribute("keycode",childNodes[1].value);
  }
}

function onReset()
{
  var aKey = keys[content.parentNode.treeBoxObject.treeBody.childNodes[content.parentNode.view.selection.currentIndex].id];

  try{
  window.opener.keyconfig.prefService.clearUserPref("keyconfig."+window.opener.keyconfig.aWindow+"."+aKey.id);
  }catch(err){}

  content.childNodes[content.parentNode.view.selection.currentIndex].childNodes[0].childNodes[1].setAttribute("label",
  messages.onreset);
}

function getNameForId(aKey)
{
  var keyUsers = window.opener.document.getElementsByAttribute("key",aKey);
  for(var i = 0; i < keyUsers.length; i++)
    if(keyUsers[i].label) return keyUsers[i].label;

  aKey = aKey.replace(/xxx_key.+?_/,"");

  if(keyname[aKey]) return keyname[aKey];

  return aKey;
}
