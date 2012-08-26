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
    License along with this library. If not, see
    <http://www.gnu.org/licenses/>.
*/

const MOD_DIRNAME = "bsmod", MOD_MAIN_FILENAME = "bsMod.jsm";
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

function get_mainFileURI (aResourceURI) {
  var spec = aResourceURI.spec;
  spec += MOD_DIRNAME + "/" + MOD_MAIN_FILENAME;
  return Services.io.newURI(spec, null, null);
}

function install (aData, aReason) {
  var mainFileURI = get_mainFileURI(aData.resourceURI);
  Cu.import(mainFileURI.spec);
  bsMod.install(aData, aReason);
}

function uninstall (aData, aReason) {
  bsMod.uninstall(aData, aReason);
  var mainFileURI = get_mainFileURI(aData.resourceURI);
  Cu.unload(mainFileURI.spec);
}

function startup (aData, aReason) {
  var mainFileURI = get_mainFileURI(aData.resourceURI);
  Cu.import(mainFileURI.spec);
  bsMod.startup(aData, aReason);
}

function shutdown (aData, aReason) {
  bsMod.shutdown(aData, aReason);
}
