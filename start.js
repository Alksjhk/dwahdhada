#!/usr/bin/env bun

/**
 * 合并前后端启动脚本
 *
 * 这个脚本会：
 * 1. 检查前端是否已构建
 * 2. 启动后端服务器（服务前端静态文件 + API）
 *
 * 使用方法：
 *   bun start.js
 *
 * 或者直接：
 *   bun server/src/app.ts
 */

import { $ } from "bun";
import fs from "fs";
import path from "path";

const serverDir = path.join(import.meta.dir, "server");
const clientDistDir = path.join(import.meta.dir, "client/dist");
const serverSrc = path.join(serverDir, "src/app.ts");

async function checkFrontendBuild() {
    if (!fs.existsSync(clientDistDir)) {
        console.log("❌ 前端未构建，请先运行: cd client && bun run build");
        return false;
    }

    const indexHtml = path.join(clientDistDir, "index.html");
    if (!fs.existsSync(indexHtml)) {
        console.log("❌ 前端构建文件不完整，请重新构建: cd client && bun run build");
        return false;
    }

    console.log("✅ 前端静态文件已准备就绪");
    return true;
}

async function startServer() {
    if (!fs.existsSync(serverSrc)) {
        console.log("❌ 后端源文件不存在");
        return;
    }

    console.log("🚀 启动合并后端服务器...");
    console.log("📊 服务端口: 3001");
    console.log("🌐 访问地址: http://localhost:3001");
    console.log("");
    console.log("功能说明:");
    console.log("  - 前端页面: http://localhost:3001/");
    console.log("  - API接口: http://localhost:3001/api/*");
    console.log("  - 文件上传: http://localhost:3001/uploads/*");
    console.log("  - SSE实时消息: http://localhost:3001/api/sse/*");
    console.log("");
    console.log("按 Ctrl+C 停止服务器");
    console.log("");

    // 启动开发服务器（带热重载）
    await $`bun --watch ${serverSrc}`.cwd(serverDir);
}

async function main() {
    console.log("=== 聊天系统合并部署启动器 ===\n");

    const frontendOk = await checkFrontendBuild();
    if (!frontendOk) {
        process.exit(1);
    }

    await startServer();
}

main().catch(console.error);