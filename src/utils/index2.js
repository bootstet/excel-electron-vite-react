const findStringAndNextWord = (str, target) => {
  if (!str) return ""; // 如果输入字符串为空，直接返回空

  const targets = target.split(',').map(t => t.trim()); // 按逗号拆分，并去除两端空格

  for (const currentTarget of targets) {
    // 严格匹配：currentTarget 后面必须紧跟字母数字（不能是换行或空格）
    const regex = new RegExp(`${currentTarget}([a-zA-Z0-9]+)`);
    const match = str.match(regex);

    if (match) {
      return match[1] || ""; // 返回匹配的字母数字部分
    }
  }

  return ""; // 所有关键词都没匹配到，返回空字符串
};

// 测试用例
const str1 = `str SKC：
SKC货号：sd2
备货母单号：WP24091916442`;

console.log(findStringAndNextWord(str1, "SKC：,SKC货号：")); // 输出 ""（SKC：无匹配，SKC货号：匹配到 "sd2"）
console.log(findStringAndNextWord(str1, "SKC货号：,SKC：")); // 输出 "sd2"（SKC货号：优先匹配）
console.log(findStringAndNextWord("SKC：abc,SKC货号：", "SKC：,SKC货号：")); // 输出 "abc"（SKC：优先匹配）
console.log(findStringAndNextWord("SKC货号：xyz", "SKC：,SKC货号：")); // 输出 "xyz"（SKC：无匹配，SKC货号：匹配到）