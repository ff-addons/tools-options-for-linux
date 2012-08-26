/*
    Tools > Options for Linux, extension for Firefox 3.0+
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
            var n = document.getElementById("menu_preferences");
            n.hidden = hideItem;
            var hideSep = prefBranch.getBoolPref("hide_prefsSeparator");

            for (n = n.previousSibling; n; n = n.previousSibling) {
              if (n.nodeType == Node.ELEMENT_NODE) {
                if (n.nodeName.toLowerCase() == "menuseparator")
                  n.hidden = hideItem && hideSep;
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
      '//xul:menu[@id="edit-menu" or @id="menu_Edit"]/xul:menupopup[1]'));
    window.removeEventListener("load", init_menuitemDynamic, false);
  },
  false);
