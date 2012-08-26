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
  Usage - put the following anywhere in bsmod.manifest:

  defaultPrefs defaultprefs.cfg

  where defaultprefs.cfg is the name of the configuration file (can be
  any name you like). Create a file of that name in your extension's
  root. Each line must consist of a fully-qualified preference name,
  some whitespace, then the default value (boolean, integer, or
  string, parseable as JSON).
*/

const EXPORTED_SYMBOLS = ["defaultPrefs"];

const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

var bsMod;

var defaultPrefs = {
  init: function (aBSMod, aArgs) {
    bsMod = aBSMod;
    this._readConfig(aArgs[1]);
  },

  install: function (aData, aReason) { },

  uninstall: function (aData, aReason) {
    bsMod = null;
  },

  startup: function (aData, aReason) { },

  shutdown: function (aData, aReason) { },

  _readConfig: function (aFilename) {
    var content = bsMod.readExtensionFile(aFilename);
    var lines = content.split(/[\n\r]/);
    var branch = Services.prefs.getDefaultBranch("");

    for each (let line in lines) {
      if (!line || line[0] == "#") continue;

      let match = line.match(/([^\s]+)\s+(.*)/);
      let [prefName, strValue] = [match[1], match[2]];

      try {
        let objValue = JSON.parse(strValue);

        switch (typeof objValue) {
        case "boolean":
          branch.setBoolPref(prefName, objValue);
          break;

        case "number":
          branch.setIntPref(prefName, parseInt(objValue));
          break;

        case "string":
          branch.setCharPref(prefName, objValue);
          break;
        }
      } catch (e) {}
    }
  },
};
