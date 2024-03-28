class TrieNode {
    children: { [key: string]: TrieNode }
    isEndOfWord: boolean
    constructor() {
      this.children = {}
      this.isEndOfWord = false
    }
  }
  
  export class Trie {
    root: TrieNode
    constructor() {
      this.root = new TrieNode()
    }
  
    insert(word) {
      let node = this.root
      for (const char of word) {
        if (!node.children[char]) {
          node.children[char] = new TrieNode()
        }
        node = node.children[char]
      }
      node.isEndOfWord = true
    }
  
    searchBestMatch(prefix) {
      let node = this.root
      let result = ""
  
      for (const char of prefix) {
        if (node && node.children[char]) {
          result += char
          node = node.children[char]
        } else {
          return result
        }
      }
  
      if (node && node.isEndOfWord) {
        return result
      }

      while (node) {
        const childrenKeys = Object.keys(node.children)
        if (childrenKeys.length === 0) break 
        const nextChar = childrenKeys[0]
        result += nextChar
        node = node.children[nextChar]
        if (node.isEndOfWord) {
          return result
        }
      }
  
      return result
    }
  }
  