const str1 = `str SKC：
SKC货号：123
备货母单号：WP24091919262
03
备货单号：WB2409191308619
创建时间：2024-09-19 07:22
要求发货时间：2024-09-20
07:22
【VMI】     【JIT】     【加急】`

const target1 = `SKC：,SKC货号：`




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

console.log(findStringAndNextWord(str1, target1))

