#!/bin/bash
# myTags 服务器首次部署脚本
# 在服务器上运行一次即可，用于初始化目录和创建 .env

set -e

BACKEND_DIR="${1:-/root/mytags-backend}"
WEB_ROOT="${2:-/var/www/mytags}"

echo "========== myTags 服务器初始化脚本 =========="
echo "后端目录: $BACKEND_DIR"
echo "前端目录: $WEB_ROOT"

# 创建目录
mkdir -p "$BACKEND_DIR"
mkdir -p "$WEB_ROOT"

echo ""
echo "请在 $BACKEND_DIR/.env 中配置以下环境变量:"
echo "  DATABASE_URL=\"mysql://用户名:密码@localhost:3306/mytags\""
echo "  JWT_SECRET=\"你的随机密钥（至少32字符）\""
echo "  PORT=3001"
echo ""

# 创建默认 .env（如果不存在）
if [ ! -f "$BACKEND_DIR/.env" ]; then
  cat > "$BACKEND_DIR/.env" << 'EOF'
DATABASE_URL="mysql://root:password@localhost:3306/mytags"
JWT_SECRET="change-this-to-a-random-secret-key"
PORT=3001
EOF
  echo "已创建默认 .env 文件，请修改！"
else
  echo ".env 已存在，跳过创建"
fi

echo ""
echo "首次部署后，请运行以下命令初始化数据库:"
echo "  cd $BACKEND_DIR"
echo "  npx prisma db push"
echo ""
echo "========== 初始化完成 =========="
