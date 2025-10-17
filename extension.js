// Name: Web Local Storage+
// ID: localstorageplus
// Description: Stockage web complet avec JSON, listes, namespaces, mot de passe et multi-langue dynamique (inspiré de text.js).
// By: Startoto1007 <https://github.com/Startoto1007/>
// License: MPL-2.0

class LocalStorageShim {
  constructor() { this._map = Object.create(null); }
  setItem(k, v) { this._map[String(k)] = String(v); }
  getItem(k) { const v = this._map[String(k)]; return v === undefined ? null : String(v); }
  removeItem(k) { delete this._map[String(k)]; }
  clear() { this._map = Object.create(null); }
  key(i) { return Object.keys(this._map)[i] || null; }
  get length() { return Object.keys(this._map).length; }
}

class LocalStoragePlus {
  constructor() {
    // stockage (localStorage natif ou shim)
    this._initStorage();

    // paramètres
    this._namespace = 'default';
    this._password = '';
    // langue : 'en' ou 'fr'. On tente de lire la préférence depuis localStorage natif si possible.
    this._lang = (this._storage?.getItem('__lsplus_lang') || 'en') || 'en';

    // setup
    this._setupStorageEvent();
  }

  _initStorage() {
    try {
      const testKey = '__lsplus_test__';
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        this._storage = window.localStorage;
        this._isNative = true;
      } else throw new Error('no localStorage');
    } catch {
      this._storage = new LocalStorageShim();
      this._isNative = false;
    }
  }

  _setupStorageEvent() {
    if (typeof window !== 'undefined' && this._isNative) {
      window.addEventListener('storage', (e) => {
        if (e.storageArea === window.localStorage) {
          // même comportement que text.js : déclenche les hats quand une autre fenêtre change storage
          Scratch.vm.runtime.startHats('localstorage_whenChanged');
        }
      });
    }
  }

  // helpers crypto léger (XOR + base64)
  _encrypt(v) {
    if (!this._password) return v;
    const s = String(v);
    const pass = String(this._password);
    const chars = Array.from(s);
    const pchars = Array.from(pass);
    const res = chars.map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ pchars[i % pchars.length].charCodeAt(0))
    ).join('');
    return btoa(res);
  }

  _decrypt(v) {
    if (!this._password) return v;
    try {
      const decoded = atob(v);
      const pass = String(this._password);
      const pchars = Array.from(pass);
      return Array.from(decoded).map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ pchars[i % pchars.length].charCodeAt(0))
      ).join('');
    } catch {
      return v;
    }
  }

  _safeParseJSON(s) {
    try { return JSON.parse(s); } catch { return s; }
  }

  _getFullKey(k) {
    return `${this._namespace}:${String(k)}`;
  }

  // --- getInfo construit des paires de blocs (EN + FR) et utilise hideFromPalette pour masquer la langue inactive ---
  getInfo() {
    // chaînes EN
    const EN = {
      name: 'Web Local Storage+',
      label: 'Storage+ EN by Startoto1007',
      btnSwitch: 'Switch to French',
      setNamespace: 'set namespace to [NAMESPACE]',
      setPassword: 'set password to [PASSWORD]',
      setItem: 'set [KEY] to [VALUE]',
      getItem: 'get [KEY]',
      deleteItem: 'delete [KEY]',
      keyExists: 'key [KEY] exists?',
      saveList: 'save list [LIST] as [KEY]',
      loadToList: 'load [KEY] into list [LIST]',
      exportStorage: 'export storage as JSON',
      importStorage: 'import storage from JSON [DATA]',
      getAllKeys: 'all storage keys',
      clearStorage: 'clear storage',
      isNative: 'using real localStorage?',
      whenChanged: 'when storage changes'
    };

    // chaînes FR
    const FR = {
      name: 'Stockage Web+',
      label: 'Storage+ FR by Startoto1007',
      btnSwitch: 'Passer en anglais',
      setNamespace: 'définir l’espace de noms sur [NAMESPACE]',
      setPassword: 'définir le mot de passe sur [PASSWORD]',
      setItem: 'mettre [KEY] à [VALUE]',
      getItem: 'obtenir [KEY]',
      deleteItem: 'supprimer [KEY]',
      keyExists: 'la clé [KEY] existe ?',
      saveList: 'sauvegarder la liste [LIST] sous [KEY]',
      loadToList: 'charger [KEY] dans la liste [LIST]',
      exportStorage: 'exporter le stockage en JSON',
      importStorage: 'importer le stockage depuis JSON [DATA]',
      getAllKeys: 'toutes les clés du stockage',
      clearStorage: 'vider le stockage',
      isNative: 'utilise le vrai localStorage ?',
      whenChanged: 'quand le stockage change'
    };

    const active = this._lang === 'fr' ? FR : EN;
    const inactive = this._lang === 'fr' ? EN : FR;

    // ressources communes
    const blocks = [];

    // Label (affiche la langue active)
    blocks.push({ blockType: Scratch.BlockType.LABEL, text: active.label });

    // Bouton (ici on utilise la propriété 'func' comme dans text.js)
    blocks.push({
      func: 'toggleLanguage',
      blockType: Scratch.BlockType.BUTTON,
      text: active.btnSwitch,
      // bouton toujours visible => pas de hideFromPalette
    });

    // helper pour déclarer un pair EN/FR et masquer l'inactif
    const addPair = (opcodeBase, blockType, enText, frText, args) => {
      // EN
      blocks.push({
        opcode: opcodeBase + '_en',
        blockType,
        text: enText,
        arguments: args || {},
        hideFromPalette: this._lang !== 'en'
      });
      // FR
      blocks.push({
        opcode: opcodeBase + '_fr',
        blockType,
        text: frText,
        arguments: args || {},
        hideFromPalette: this._lang !== 'fr'
      });
    };

    const keyArg = { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'key' } };
    const nsArg = { NAMESPACE: { type: Scratch.ArgumentType.STRING, defaultValue: 'default' } };
    const pwdArg = { PASSWORD: { type: Scratch.ArgumentType.STRING, defaultValue: '' } };
    const valueArg = { KEY: keyArg.KEY, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'value' } };
    const listArg = { LIST: { type: Scratch.ArgumentType.LIST, defaultValue: 'list' }, KEY: keyArg.KEY };
    const importArg = { DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"key":"value"}' } };

    // paires de blocs (EN + FR)
    addPair('setNamespace', Scratch.BlockType.COMMAND, EN.setNamespace, FR.setNamespace, nsArg);
    addPair('setPassword', Scratch.BlockType.COMMAND, EN.setPassword, FR.setPassword, pwdArg);
    addPair('setItem', Scratch.BlockType.COMMAND, EN.setItem, FR.setItem, valueArg);
    addPair('getItem', Scratch.BlockType.REPORTER, EN.getItem, FR.getItem, keyArg);
    addPair('deleteItem', Scratch.BlockType.COMMAND, EN.deleteItem, FR.deleteItem, keyArg);
    addPair('keyExists', Scratch.BlockType.BOOLEAN, EN.keyExists, FR.keyExists, keyArg);
    addPair('saveList', Scratch.BlockType.COMMAND, EN.saveList, FR.saveList, listArg);
    addPair('loadToList', Scratch.BlockType.COMMAND, EN.loadToList, FR.loadToList, listArg);
    addPair('exportStorage', Scratch.BlockType.REPORTER, EN.exportStorage, FR.exportStorage);
    addPair('importStorage', Scratch.BlockType.COMMAND, EN.importStorage, FR.importStorage, importArg);
    addPair('getAllKeys', Scratch.BlockType.REPORTER, EN.getAllKeys, FR.getAllKeys);
    addPair('clearStorage', Scratch.BlockType.COMMAND, EN.clearStorage, FR.clearStorage);
    addPair('isNativeStorage', Scratch.BlockType.BOOLEAN, EN.isNative, FR.isNative);
    // event block (whenChanged)
    addPair('whenChanged', Scratch.BlockType.EVENT, EN.whenChanged, FR.whenChanged);

    return {
      id: 'localstorageplus',
      name: active.name,
      color1: '#0FBD8C',
      color2: '#0DA57A',
      color3: '#0A8552',
      docsURI: 'https://startoto1007.github.io/localstorage-extension/documentation.html',
      blocks
    };
  }

  // bouton (fonction appelée directement via la propriété func)
  toggleLanguage() {
    // inverse la langue
    this._lang = this._lang === 'fr' ? 'en' : 'fr';
    // sauvegarde la préférence si possible
    try {
      if (this._isNative) this._storage.setItem('__lsplus_lang', this._lang);
    } catch {}
    // refresh all blocks like text.js does (refreshBlocks sans argument pour redessiner toute la palette)
    if (Scratch && Scratch.vm && Scratch.vm.extensionManager) {
      // text.js utilise Scratch.vm.extensionManager.refreshBlocks()
      Scratch.vm.extensionManager.refreshBlocks();
    }
  }

  // --- implémentations réelles (déléguées aux opcodes en/fr) ---
  // setNamespace
  setNamespace_en(args) { return this._setNamespace(args); }
  setNamespace_fr(args) { return this._setNamespace(args); }
  _setNamespace(args) { this._namespace = String(args.NAMESPACE || 'default'); }

  // setPassword
  setPassword_en(args) { return this._setPassword(args); }
  setPassword_fr(args) { return this._setPassword(args); }
  _setPassword(args) { this._password = String(args.PASSWORD || ''); }

  // setItem/getItem/delete/keyExists
  setItem_en(args) { return this._setItem(args); }
  setItem_fr(args) { return this._setItem(args); }
  _setItem(args) {
    try {
      let v = args.VALUE;
      if (Array.isArray(v) || typeof v === 'object') v = JSON.stringify(v);
      const enc = this._encrypt(String(v));
      this._storage.setItem(this._getFullKey(args.KEY), enc);
    } catch {}
  }

  getItem_en(args) { return this._getItem(args); }
  getItem_fr(args) { return this._getItem(args); }
  _getItem(args) {
    try {
      const raw = this._storage.getItem(this._getFullKey(args.KEY));
      if (raw === null) return '';
      const dec = this._decrypt(raw);
      return this._safeParseJSON(dec);
    } catch { return ''; }
  }

  deleteItem_en(args) { return this._deleteItem(args); }
  deleteItem_fr(args) { return this._deleteItem(args); }
  _deleteItem(args) { try { this._storage.removeItem(this._getFullKey(args.KEY)); } catch {} }

  keyExists_en(args) { return this._keyExists(args); }
  keyExists_fr(args) { return this._keyExists(args); }
  _keyExists(args) { try { return this._storage.getItem(this._getFullKey(args.KEY)) !== null; } catch { return false; } }

  // save list (convertit la liste Scratch en JSON et la stocke)
  saveList_en(args) { return this._saveList(args); }
  saveList_fr(args) { return this._saveList(args); }
  _saveList(args) {
    try {
      const listVar = Scratch.vm.runtime.getTargetForStage().lookupVariableById(args.LIST.id);
      if (!listVar || !Array.isArray(listVar.value)) return;
      const json = JSON.stringify(listVar.value);
      this._storage.setItem(this._getFullKey(args.KEY), this._encrypt(json));
    } catch {}
  }

  // loadToList : remet le contenu JSON (tableau) dans la liste Scratch (vide puis push)
  loadToList_en(args) { return this._loadToList(args); }
  loadToList_fr(args) { return this._loadToList(args); }
  _loadToList(args) {
    try {
      const raw = this._storage.getItem(this._getFullKey(args.KEY));
      if (raw === null) return;
      const parsed = this._safeParseJSON(this._decrypt(raw));
      if (!Array.isArray(parsed)) return;
      const listVar = Scratch.vm.runtime.getTargetForStage().lookupVariableById(args.LIST.id);
      if (!listVar) return;
      // remplacer le contenu de la liste
      listVar.value = [];
      for (const it of parsed) listVar.value.push(it);
    } catch {}
  }

  // export / import
  exportStorage_en() { return this._exportStorage(); }
  exportStorage_fr() { return this._exportStorage(); }
  _exportStorage() {
    try {
      const prefix = `${this._namespace}:`;
      const out = {};
      for (let i = 0; i < this._storage.length; i++) {
        const k = this._storage.key(i);
        if (k && k.startsWith(prefix)) {
          out[k.slice(prefix.length)] = this._decrypt(this._storage.getItem(k));
        }
      }
      return JSON.stringify(out);
    } catch { return '{}'; }
  }

  importStorage_en(args) { return this._importStorage(args); }
  importStorage_fr(args) { return this._importStorage(args); }
  _importStorage(args) {
    try {
      const d = JSON.parse(args.DATA);
      for (const [k, v] of Object.entries(d)) {
        this._storage.setItem(this._getFullKey(k), this._encrypt(String(v)));
      }
    } catch {}
  }

  getAllKeys_en() { return this._getAllKeys(); }
  getAllKeys_fr() { return this._getAllKeys(); }
  _getAllKeys() {
    try {
      const prefix = `${this._namespace}:`;
      const keys = [];
      for (let i = 0; i < this._storage.length; i++) {
        const k = this._storage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k.slice(prefix.length));
      }
      return JSON.stringify(keys);
    } catch { return '[]'; }
  }

  clearStorage_en() { return this._clearStorage(); }
  clearStorage_fr() { return this._clearStorage(); }
  _clearStorage() {
    try {
      const prefix = `${this._namespace}:`;
      const toDel = [];
      for (let i = 0; i < this._storage.length; i++) {
        const k = this._storage.key(i);
        if (k && k.startsWith(prefix)) toDel.push(k);
      }
      toDel.forEach(k => this._storage.removeItem(k));
    } catch {}
  }

  isNativeStorage_en() { return this._isNative; }
  isNativeStorage_fr() { return this._isNative; }

  // event block (whenChanged) : hat déclenché par storage event, pas besoin de corps
}

Scratch.extensions.register(new LocalStoragePlus());
