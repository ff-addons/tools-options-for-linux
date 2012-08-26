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

const EXPORTED_SYMBOLS = ["bsMod"];

const BSMOD_DIRNAME = "bsmod";
const Cc = Components.classes, Ci = Components.interfaces,
      Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

var bsMod = {
  install: function (aData, aReason) {
    this._init(aData.resourceURI);
    for (let i = 0; i < this._startupModules.length; i++)
      this._modules[this._startupModules[i]].install(aData, aReason);
  },

  uninstall: function (aData, aReason) {
    for (let i = 0; i < this._startupModules.length; i++)
      this._modules[this._startupModules[i]].uninstall(aData, aReason);
    for (let name in this._modules)
      this.unload(name);
  },

  startup: function (aData, aReason) {
    this._init(aData.resourceURI);
    for (let i = 0; i < this._startupModules.length; i++)
      this._modules[this._startupModules[i]].startup(aData, aReason);
  },

  shutdown: function (aData, aReason) {
    for (let i = 0; i < this._startupModules.length; i++)
      this._modules[this._startupModules[i]].shutdown(aData, aReason);
  },

  readExtensionFile: function (aRelativePath) {
    var channel = Services.io.newChannel(
      this._resourceURI.spec + aRelativePath, null, null);
    channel.contentCharset = "US-ASCII";
    var inpStream = channel.open();
    var scrInpStream = Cc["@mozilla.org/scriptableinputstream;1"].
                       createInstance(Ci.nsIScriptableInputStream);
    scrInpStream.init(inpStream);
    var content = scrInpStream.readBytes(scrInpStream.available());
    scrInpStream.close();
    inpStream.close();

    return content;
  },

  import: function (aModName) {
    if (aModName in this._modules)
      return this._modules[aModName];

    var env = {};
    Cu.import(this._resourceURI.spec + BSMOD_DIRNAME
                + "/" + aModName + ".jsm",
              env);
    var mod = env[aModName];
    return this._modules[aModName] = mod;
  },

  unload: function (aModName) {
    delete this._modules[aModName];
    Cu.unload(this._resourceURI.spec + BSMOD_DIRNAME
                + "/" + aModName + ".jsm");
  },

  get chromeContentBase () this._chromeContentBase,

  _inited: false,
  _bsmodBase: null,
  _chromeContentBase: null,
  _modules: {},
  _startupModules: [],

  _init: function (aResourceURI) {
    if (this._inited)
      return;

    this._resourceURI = aResourceURI;  
    this._getContentNamespace();
    this._readBSModCfg();
    this._inited = true;
  },

  _getContentNamespace: function () {
    var content = this.readExtensionFile("chrome.manifest");
    var directives = content.split(/\r\n|\r|\n/);

    for each (let line in directives) {
      let words = line.split(/\s+/);
      if (words[0] == "content") {
        this._chromeContentBase = "chrome://" + words[1] + "/content/";
        break;
      }
    }
  },

  _readBSModCfg: function () {
    var content = this.readExtensionFile("bsmod.cfg");
    var lines = content.split(/\r\n|\r|\n/);

    for each (let line in lines) {
      if (line == "" || line[0] == "#") continue;

      let match = line.match(/(\S+)\s(.*)/);
      let module = this.import(match[1]);
      this._startupModules.push(match[1]);
      module.init(this, [match[1], match[2]]);
    }
  },
};
