class LocalStorageExtension {
  getInfo() {
    return {
      id: 'localstorage',
      name: 'Web Local Storage',
      color1: '#0FBD8C',
      color2: '#0DA57A',
      color3: '#0A8552',
      blocks: [
        {
          opcode: 'setItem',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set [KEY] to [VALUE]',
          arguments: {
            KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'key' },
            VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'value' }
          }
        },
        {
          opcode: 'getItem',
          blockType: Scratch.BlockType.REPORTER,
          text: 'get [KEY]',
          arguments: {
            KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'key' }
          }
        },
        {
          opcode: 'deleteItem',
          blockType: Scratch.BlockType.COMMAND,
          text: 'delete [KEY]',
          arguments: {
            KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'key' }
          }
        },
        {
          opcode: 'keyExists',
          blockType: Scratch.BlockType.BOOLEAN,
          text: 'key [KEY] exists?',
          arguments: {
            KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'key' }
          }
        },
        {
          opcode: 'isEmpty',
          blockType: Scratch.BlockType.BOOLEAN,
          text: 'storage is empty?'
        },
        {
          opcode: 'clearStorage',
          blockType: Scratch.BlockType.COMMAND,
          text: 'clear storage'
        }
      ]
    };
  }

  setItem(args) {
    localStorage.setItem(String(args.KEY), String(args.VALUE));
  }

  getItem(args) {
    return localStorage.getItem(String(args.KEY)) ?? '';
  }

  deleteItem(args) {
    localStorage.removeItem(String(args.KEY));
  }

  keyExists(args) {
    return localStorage.getItem(String(args.KEY)) !== null;
  }

  isEmpty() {
    return localStorage.length === 0;
  }

  clearStorage() {
    localStorage.clear();
  }
}

Scratch.extensions.register(new LocalStorageExtension());
