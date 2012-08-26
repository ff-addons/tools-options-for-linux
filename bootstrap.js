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

const EXTNAME = "toolsoptions4linux",
      MODULEPREFIX = "chrome://toolsoptions4linux/content/";

const defaultPrefs = {
  "hide_editPrefs": true,
  "hide_prefsSeparator": true,
};

const overlayScripts = [
  [["navigator:browser", "mail:3pane", "msgcompose",
    "mail:addressbook", "composer:html"],
   "menubarOverlay.jsm"],
];

const Cu = Components.utils,
      Cm = Components.manager;

Cu.import("resource://gre/modules/Services.jsm");

function register_defaultPrefs (aDefPrefs) {
  var branch = Services.prefs.getDefaultBranch(
    "extensions." + EXTNAME + ".");

  for (let prefName in aDefPrefs) {
    let value = aDefPrefs[prefName];
    if (typeof(value) == "boolean")
      branch.setBoolPref(prefName, value);
    else if (typeof(value) == "number")
      branch.setIntPref(prefName, parseInt(value));
    else if (typeof(value) == "string")
      branch.setCharPref(prefName, value);
  }
}

var overlayModules = {};
var installers = {};
var windowObserver = null;

function register_loadHandler (aWin) {
  aWin.addEventListener(
    "load",
    function _loadHandler () {
      aWin.removeEventListener("load", _loadHandler, false);
      var type = aWin.document.documentElement.getAttribute("windowtype");
      if (!type || !(type in installers)) return;

      var modNames = installers[type];
      for (let i = 0; i < modNames.length; i++) {
        let mod = overlayModules[modNames[i]];
        try {
          mod.bootstrapInterface.addWindow(aWin);
        } catch (e) {}
      }
    },
    false);
}

function register_overlayScripts (aOverlayScripts) {
  for (let i = 0; i < aOverlayScripts.length; i++) {
    let [winTypes, overlayModBasename] = aOverlayScripts[i];
    overlayModules[overlayModBasename] = {};
    Cu.import(MODULEPREFIX + overlayModBasename,
              overlayModules[overlayModBasename]);
    let module = overlayModules[overlayModBasename];

    for (let j = 0; j < winTypes.length; j++) {
      let en = Services.wm.getEnumerator(winTypes[j]);
      while (en.hasMoreElements()) {
        let win = en.getNext();
        if (win.document.readyState == "complete")
          try {
            module.bootstrapInterface.addWindow(win);
          } catch (e) {}
        else
          register_loadHandler(win);
      }

      if (!(winTypes[j] in installers)) installers[winTypes[j]] = [];
      installers[winTypes[j]].push(overlayModBasename);
    }
  }

  function _windowObserver (aSubject, aTopic) {
    if (aTopic == "domwindowopened")
      register_loadHandler(aSubject);
  }

  Services.ww.registerNotification(_windowObserver);
  windowObserver = _windowObserver;
}

function unregister_overlayScripts () {
  Services.ww.unregisterNotification(windowObserver);
  windowObserver = null;
}

function uninstall_overlays (aOverlayScripts) {
  for (let i = 0; i < aOverlayScripts.length; i++) {
    let [winTypes, overlayModBasename] = aOverlayScripts[i];
    let module = overlayModules[overlayModBasename];

    for (let j = 0; j < winTypes.length; j++) {
      let en = Services.wm.getEnumerator(winTypes[j]);
      while (en.hasMoreElements()) {
        let win = en.getNext();

        try {
          module.bootstrapInterface.removeWindow(win);
        } catch (e) {}
      }
    }

    delete overlayModules[overlayModBasename];
    Cu.unload(MODULEPREFIX + overlayModBasename);
  }

  installers = {};
}

function startup (aParams, aReason) {
  if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)
    Cm.addBootstrappedManifestLocation(aParams.installPath);

  register_defaultPrefs(defaultPrefs);
  register_overlayScripts(overlayScripts);
}

function shutdown (aParams, aReason) {
  unregister_overlayScripts();
  uninstall_overlays(overlayScripts);

  if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)
    Cm.removeBootstrappedManifestLocation(aParams.installPath);
}
