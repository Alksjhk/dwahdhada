#!/usr/bin/env bun

/**
 * 合并前后端启动脚本
 *
 * 这个脚本会：
 * 1. 检查前端是否已构建
 * 2. 检查后端是否已构建（dist/app.js）
 * 3. 启动后端服务器（服务前端静态文件 + API）
 *
 * 使用方法：
 *   bun start.js          # 自动构建并启动
 *   bun start.js --dev    # 开发模式（源码运行）
 */

import { $ } from "bun";
import fs from "fs";
import path from "path";

const serverDir = path.join(import.meta.dir, "server");
const clientDistDir = path.join(import.meta.dir, "client/dist");
const serverSrc = path.join(serverDir, "src/app.ts");
const serverDist = path.join(serverDir, "dist/app.js");

async function checkFrontendBuild() {
    if (!fs.existsSync(clientDistDir)) {
        console.log("❌ 前端未构建，请先运行: bun run build");
        return false;
    }

    const indexHtml = path.join(clientDistDir, "index.html");
    if (!fs.existsSync(indexHtml)) {
        console.log("❌ 前端构建文件不完整，请重新构建: bun run build");
        return false;
    }

    console.log("✅ 前端静态文件已准备就绪");
    return true;
}

async function checkBackendBuild() {
    if (!fs.existsSync(serverDist)) {
        console.log("⚠️  后端未构建，正在构建...");
        const buildResult = await $`cd ${serverDir} && bun run build`.quiet();
        if (buildResult.exitCode !== 0) {
            console.log("❌ 后端构建失败");
            return false;
        }
        console.log("✅ 后端构建完成");
    } else {
        console.log("✅ 后端构建文件已存在");
    }
    return true;
}

async function startServer(useDev = false) {
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

    if (useDev) {
        console.log("🔧 开发模式 - 使用源码运行（带热重载）");
        console.log("按 Ctrl+C 停止服务器");
        console.log("");
        await $`bun --watch ${serverSrc}`.cwd(serverDir);
    } else {
        console.log("📦 生产模式 - 使用打包后的 JS 文件");
        console.log("按 Ctrl+C 停止服务器");
        console.log("");
        await $`bun ${serverDist}`.cwd(serverDir);
    }
}

async function main() {
    console.log("=== 聊天系统合并部署启动器 ===\n");

    const args = process.argv.slice(2);
    const useDev = args.includes("--dev") || args.includes("-d");

    console.log(`运行模式: ${useDev ? "开发模式" : "生产模式"}\n`);

    // 检查前端
    const frontendOk = await checkFrontendBuild();
    if (!frontendOk) {
        process.exit(1);
    }

    // 开发模式不需要构建后端
    if (!useDev) {
        const backendOk = await checkBackendBuild();
        if (!backendOk) {
            process.exit(1);
        }
    }

    await startServer(useDev);
}

main().catch(console.error);