#!/bin/bash

# 自动修复带空格的文件名脚本
# 用法: ./fix-filenames.sh

echo "🔍 检查带空格的文件..."

# 查找所有带空格的 .ts 和 .tsx 文件
find src -type f \( -name "* *.ts" -o -name "* *.tsx" -o -name "* 2.*" \) -print0 | while IFS= read -r -d '' file; do
    echo "❌ 发现问题文件: $file"

    # 删除文件
    rm "$file"
    echo "✅ 已删除: $file"
done

echo "🎉 清理完成！"
