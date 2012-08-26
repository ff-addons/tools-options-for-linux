/*
    Tools > Options for Linux, extension for Firefox/Thunderbird/SeaMonkey
    Copyright (C) 2010  Daniel Dawson <ddawson@icehouse.net>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

window.addEventListener(
  "load",
  function init_menuitemDynamic (evt) {
    var mp = document.getElementById("menu_preferences");
    if (!mp) mp = document.getElementById(":cmd-mozilla-prefs");
    var mo = document.getElementById("menu_options");
    if (mp.hasAttribute("oncommand"))
      mo.setAttribute("oncommand", mp.getAttribute("oncommand"));
    else
      mo.setAttribute("command", mp.getAttribute("command"));

    const prefBranch =
      Components.classes["@mozilla.org/preferences-service;1"].
      getService(Components.interfaces.nsIPrefService).
      getBranch("extensions.toolsoptions4linux.");

    function register_menuitemDynamic (popup) {
      if (popup)
        popup.addEventListener(
          "popupshowing",
          function (evt) {
            var hideItem = prefBranch.getBoolPref("hide_editPrefs");
            if (hideItem)
              mp.setAttribute("hidden", "true");
            else
              mp.removeAttribute("hidden");

            var hideSep = prefBranch.getBoolPref("hide_prefsSeparator");

            for (var n = mp.previousSibling; n; n = n.previousSibling) {
              if (n.nodeType == Node.ELEMENT_NODE) {
                if (n.nodeName.toLowerCase() == "menuseparator") {
                  if (hideItem && hideSep)
                    n.setAttribute("hidden", "true");
                  else
                    n.removeAttribute("hidden");
                }
                break;
              }
            }

            return true;
          },
          false);
    }

    var normalNSResolver = document.createNSResolver(document.documentElement);
    function myNSResolver (prefix) {
      if (prefix == "xul")
        return "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
      else
        return normalNSResolver(prefix);
    }

    function myEvaluate1 (expr, resultType) {
      return document.evaluate(expr, document, myNSResolver,
        XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    register_menuitemDynamic(myEvaluate1(
      '//xul:menu[@id="edit-menu" or @id="menu_Edit" or @id="editMenu"]'
      + '/xul:menupopup[1]'));
    window.removeEventListener("load", init_menuitemDynamic, false);
  },
  false);
