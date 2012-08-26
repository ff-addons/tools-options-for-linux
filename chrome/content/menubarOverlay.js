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

    function menuitemDynamic (evt) {
      var prefsItem = document.getElementById("menu_preferences");
      var hideItem = prefBranch.getBoolPref("hide_editPrefs");
      prefsItem.hidden = hideItem;
      var hideSep = prefBranch.getBoolPref("hide_prefsSeparator");
      var sep = prefsItem;
      while (sep = sep.previousSibling) {
        if (sep.nodeType == Node.ELEMENT_NODE) {
          if (sep.nodeName.toLowerCase() == "menuseparator")
            sep.hidden = hideItem && hideSep;
          break;
        }
      }
      return true;
    }

    function register_menuitemDynamic (popup) {
      if (popup)
        popup.addEventListener("popupshowing", menuitemDynamic, false);
    }

    register_menuitemDynamic(document.getElementById("menu_EditPopup"));
    window.removeEventListener("load", init_menuitemDynamic, false);
  },
  false);
