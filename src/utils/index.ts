  // 获取SKC值
  export const findStringAndNextWord = (str, target) => {
    if (!str) {
      return null
    }
    const regex = new RegExp(target + '(\\d+)');
    const match = str.match(regex);
    return match ? match[1] : null;
  }