function onLoad()
{
  content = document.getElementById("content");
  idcol = (content.parentNode.columns ? content.parentNode.columns["id"] : "id");
  messages = document.getElementById("messages");
  keys = window.opener.document.getElementsByTagName("key");

  var sortedKeys = [];
  for(var i = 0; i != keys.length; i++)
  {
    sortedKeys.push(keys[i].id);
  }

  sortedKeys.sort();

  for(key in sortedKeys)
  {
    content.appendChild(document.createElement("treeitem"));
    with(content.lastChild.appendChild(document.createElement("treerow")))
    {
      appendChild(document.createElement("treecell"));
      appendChild(document.createElement("treecell"));
      childNodes[0].setAttribute("label",keys[sortedKeys[key]].id);
      childNodes[1].setAttribute("label",
        keys[sortedKeys[key]].getAttribute("modifiers").replace(",","+").replace(" ","+")+"+"+
        keys[sortedKeys[key]].getAttribute("key").toUpperCase()+
        keys[sortedKeys[key]].getAttribute("keycode")
      );
      if(!(keys[sortedKeys[key]].getAttribute("command") || keys[sortedKeys[key]].getAttribute("oncommand")))
      {
        childNodes[0].setAttribute("properties","disabled");
        childNodes[1].setAttribute("properties","disabled");
      }
    }
  }

  document.getElementById("edit").childNodes[0].value="";
  document.getElementById("edit").childNodes[2].value="";
}

function onOK()
{
  alert(messages.getAttribute("warn"));

  return true;
}

function onSelect()
{
  aKey = keys[content.parentNode.view.getCellText(content.parentNode.view.selection.currentIndex,idcol)];
  with(document.getElementById("edit"))
  {
    childNodes[0].value=aKey.getAttribute("modifiers").replace(",","+").replace(" ","+");
    childNodes[1].value=aKey.getAttribute("key").toUpperCase();
    childNodes[2].value=aKey.getAttribute("keycode");
  }
}

function onApply()
{
  if(content.parentNode.view.selection.currentIndex == -1)return;

  aKey = keys[content.parentNode.view.getCellText(content.parentNode.view.selection.currentIndex,idcol)];

  with(document.getElementById("edit"))
  {
    window.opener.keyconfig.prefService.setCharPref("keyconfig."+window.opener.keyconfig.aWindow+"."+aKey.id,
      childNodes[0].value.replace("+",",")+"]["+
      childNodes[1].value+"]["+
      childNodes[2].value
    );

    content.childNodes[content.parentNode.view.selection.currentIndex].childNodes[0].childNodes[1].setAttribute("label",
      childNodes[0].value+"+"+
      childNodes[1].value+
      childNodes[2].value
    );

    aKey.setAttribute("modifiers",childNodes[0].value.replace("+",","));
    aKey.setAttribute("key",childNodes[1].value);
    aKey.setAttribute("keycode",childNodes[2].value);

  }
}

function onReset()
{
  aKey = keys[content.parentNode.view.getCellText(content.parentNode.view.selection.currentIndex,idcol)];

  try{
  window.opener.keyconfig.prefService.clearUserPref("keyconfig."+window.opener.keyconfig.aWindow+"."+aKey.id);
  }catch(err){}

  content.childNodes[content.parentNode.view.selection.currentIndex].childNodes[0].childNodes[1].setAttribute("label",
  messages.getAttribute("onreset"));
}
