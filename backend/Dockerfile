# 西江阅·诗笺 后端（零依赖 Node >= 24，node:sqlite）
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
# 仅拷贝后端所需文件（数据不入镜像，运行时挂卷）
COPY backend/server.js backend/server.js
# 数据目录（挂持久卷后 DB 落卷内）
ENV DATA_DIR=/data PORT=8080
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "backend/server.js"]
