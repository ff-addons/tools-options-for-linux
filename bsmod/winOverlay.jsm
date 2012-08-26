/*
    bsMod -- my own JavaScript modules for bootstrapped extensions
    Copyright (C) 2012  Daniel Dawson <ddawson@icehouse.net>

    This library is free software: you can redistribute it and/or
    modify it under the terms of the GNU Lesser General Public
    License as published by the Free Software Foundation, either
    version 3 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public 
    License along with this program.  If not, see 
    <http://www.gnu.org/licenses/>.
*/

/*
  Usage -- put the following anywhere in bsmod.manifest:

  winOverlay winoverlay.cfg

  where winoverlay.cfg is the name of the configuration file (can be
  any name you like). Create a file of that name in your extension's
  root, with the following on each line:

  windowtype module1.jsm module2.jsm ...

  where windowtype is a name registered with the Window Mediator
  service (usually by having the "windowtype" attribute set on the root
  window element of a XUL document), and module1.jsm, etc., are
  pathnames of modules within your extension's chrome content package.
  The pathnames must not contain whitespace. (They are suffixed as part
  of URLs, so any spaces in path components must be percent-encoded
  anyway.)

  Each module must export an object winOverlayInterface that contains
  these methods:

  addWindow (aWin) - window aWin is ready and should now be overlayed.
  removeWindow (aWin) - time to remove anything previously added by
                        addWindow().
*/

const EXPORTED_SYMBOLS = ["winOverlay"];

const Ci = Components.interfaces, Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

var bsMod,
    overlayModules = {},
    installers = {};

function register_loadUnloadHandlers (aWin) {
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
          mod.winOverlayInterface.addWindow(aWin);
        } catch (e) {}
      }
    },
    false);

  aWin.addEventListener(
    "unload",
    function _unloadHandler (aEvt) {
      var target = aEvt.target;
      if (!(target instanceof Ci.nsIDOMXULDocument
            && target.defaultView == aWin)
          && target != aWin)
        return;

      aWin.removeEventListener("unload", _unloadHandler, false);
      var type = aWin.document.documentElement.getAttribute("windowtype");
      if (!type || !(type in installers)) return;

      var modNames = installers[type];
      for (let i = 0; i < modNames.length; i++) {
        let mod = overlayModules[modNames[i]];
        try {
          mod.winOverlayInterface.removeWindow(aWin);
        } catch (e) {}
      }
    },
    false);
}

var winOverlay = {
  _overlayScripts: [],
  _windowObserver: null,

  init: function (aBSMod, aArgs) {
    bsMod = aBSMod;
    this._readManifest(aArgs[1]);
  },

  install: function (aData, aReason) { },

  uninstall: function (aData, aReason) {
    bsMod = null;
  },

  startup: function (aData, aReason) {
    for (let i = 0; i < this._overlayScripts.length; i++) {
      let [winTypes, overlayModBasename] = this._overlayScripts[i];
      overlayModules[overlayModBasename] = {};
      Cu.import(bsMod.chromeContentBase + overlayModBasename,
                overlayModules[overlayModBasename]);
      let module = overlayModules[overlayModBasename];

      for (let j = 0; j < winTypes.length; j++) {
        let en = Services.wm.getEnumerator(winTypes[j]);
        while (en.hasMoreElements()) {
          let win = en.getNext();
          if (win.document.readyState == "complete")
            try {
              module.winOverlayInterface.addWindow(win);
            } catch (e) {}
          else
            register_loadUnloadHandlers(win);
        }

        if (!(winTypes[j] in installers))
          installers[winTypes[j]] = [];
        installers[winTypes[j]].push(overlayModBasename);
      }
    }

    function _windowObserver (aSubject, aTopic) {
      if (aTopic == "domwindowopened")
        register_loadUnloadHandlers(aSubject);
    }

    Services.ww.registerNotification(_windowObserver);
    this._windowObserver = _windowObserver;
  },

  shutdown: function (aData, aReason) {
    Services.ww.unregisterNotification(this._windowObserver);
    this._windowObserver = null;

    for (let i = 0; i < this._overlayScripts.length; i++) {
      let [winTypes, overlayModBasename] = this._overlayScripts[i];
      let module = overlayModules[overlayModBasename];

      for (let j = 0; j < winTypes.length; j++) {
        let en = Services.wm.getEnumerator(winTypes[j]);
        while (en.hasMoreElements()) {
          let win = en.getNext();

          try {
            module.winOverlayInterface.removeWindow(win);
          } catch (e) {}
        }
      }

      delete overlayModules[overlayModBasename];
      Cu.unload(bsMod.chromeContentBase + overlayModBasename);
    }

    installers = {};
  },

  _readManifest: function (aFilename) {
    var content = bsMod.readExtensionFile(aFilename);
    for each (let line in content.split(/[\n\r]/)) {
      if (!line || line[0] == "#") continue;

      let windowNames = line.split(/\s+/);
      let scriptFilename = windowNames.shift();
      this._overlayScripts.push([windowNames, scriptFilename]);
    }
  },
};
