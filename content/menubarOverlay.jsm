/*
    Tools > Options for Linux, extension for Firefox/Thunderbird/SeaMonkey
    Copyright (C) 2012  Daniel Dawson <ddawson@icehouse.net>

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

var EXPORTED_SYMBOLS = ["winOverlayInterface"];

const OPTIONS_SEP_ID = "toolsoptions4linux-prefSep",
      OPTIONS_ID = "toolsoptions4linux-menu_options";

const Ci = Components.interfaces, Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyGetter(
  this, "strings", function ()
    Services.strings.createBundle(
      "chrome://toolsoptions4linux/locale/menubarOverlay.properties"));
XPCOMUtils.defineLazyGetter(
  this, "prefs", function ()
    Services.prefs.getBranch("extensions.toolsoptions4linux."));

function el (aWin, aId) aWin.document.getElementById(aId);

var windows = [];

function find_prefsSeparator (aMP) {
  for (let n = aMP.previousSibling; n; n = n.previousSibling)
    if (n.nodeType == n.ELEMENT_NODE
        && n.nodeName.toLowerCase() == "menuseparator")
      return n;

  return null;
}

var winOverlayInterface = {
  addWindow: function (aWin) {
    var popup = el(aWin, "menu_ToolsPopup");
    if (!popup) popup = el(aWin, "taskPopup");
    if (!popup) return;

    var doc = aWin.document;
    var elt = doc.createElement("menuseparator");
    elt.setAttribute("id", OPTIONS_SEP_ID);
    popup.appendChild(elt);

    elt = doc.createElement("menuitem");
    elt.setAttribute("id", OPTIONS_ID);
    elt.setAttribute("label", strings.GetStringFromName("options.label"));
    elt.setAttribute("accesskey",
                     strings.GetStringFromName("options.accesskey"));
    elt.setAttribute("image", "moz-icon://stock/gtk-preferences?size=menu");

    var mp = el(aWin, "menu_preferences");
    if (!mp) mp = el(aWin, ":cmd-mozilla-prefs");

    if (mp.hasAttribute("oncommand"))
      elt.setAttribute("oncommand", mp.getAttribute("oncommand"));
    else
      elt.setAttribute("command", mp.getAttribute("command"));
    popup.appendChild(elt);

    var normalNSResolver = doc.createNSResolver(doc.documentElement);
    function myNSResolver (aPrefix) {
      if (aPrefix == "xul")
        return "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
      else
        return normalNSResolver(aPrefix);
    }

    function myEvaluate1 (aExpr, aResultType)
      doc.evaluate(aExpr, doc, myNSResolver,
                   aWin.XPathResult.FIRST_ORDERED_NODE_TYPE, null).
        singleNodeValue;

    var editPopup = myEvaluate1(
      '//xul:menu[@id="edit-menu" or @id="menu_Edit" or @id="editMenu"]'
      + '/xul:menupopup[1]');

    function _popupshowingHandler (aEvt) {
      if (aEvt.target != editPopup) return;

      var hideItem = prefs.getBoolPref("hide_editPrefs");
      if (hideItem)
        mp.setAttribute("hidden", "true");
      else
        mp.removeAttribute("hidden");

      var hideSep = prefs.getBoolPref("hide_prefsSeparator");

      var ms = find_prefsSeparator(mp);
      if (ms) {
        if (hideItem && hideSep)
          ms.setAttribute("hidden", "true");
        else
          ms.removeAttribute("hidden");
      }

      return true;
    };

    editPopup.addEventListener("popupshowing", _popupshowingHandler, false);
    windows.push([aWin, editPopup, mp, _popupshowingHandler]);
  },

  removeWindow: function (aWin) {
    for (let i = 0; i < windows.length; i++) {
      let [matchWindow, popup, mp, popupshowingHandler] = windows[i];

      if (matchWindow == aWin) {
        mp.removeAttribute("hidden");
        let ms = find_prefsSeparator(mp);
        if (ms) ms.removeAttribute("hidden");
        popup.removeEventListener("popupshowing", popupshowingHandler, false);
        windows.splice(i, 1);
        break;
      }
    }

    if (aWin.closed) return;

    var popup = el(aWin, "menu_ToolsPopup");
    if (!popup) popup = el(aWin, "taskPopup");
    popup.removeChild(el(aWin, OPTIONS_SEP_ID));
    popup.removeChild(el(aWin, OPTIONS_ID));
  },
};
