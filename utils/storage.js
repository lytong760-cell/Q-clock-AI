const Storage = {
  async get(keys) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, (result) => resolve(result));
    });
  },
  async set(items) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(items, () => resolve());
    });
  },
  async remove(keys) {
    return new Promise((resolve) => {
      chrome.storage.sync.remove(keys, () => resolve());
    });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
