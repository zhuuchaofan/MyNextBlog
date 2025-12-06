# === 构建阶段 ===
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 1. 复制项目文件并还原依赖
COPY ["MyNextBlog.csproj", "./"]
RUN dotnet restore

# 2. 复制其余源码并发布
COPY . .
# 生成 Release 版本，输出到 /app/publish
RUN dotnet publish "MyNextBlog.csproj" -c Release -o /app/publish

# === 运行阶段 ===
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

# 1. 从构建阶段复制产物
COPY --from=build /app/publish .

# 2. 创建数据目录 (用于挂载 SQLite)
RUN mkdir -p /app/data 
# 3. 创建上传目录 (以防万一不用R2时需要)
RUN mkdir -p /app/wwwroot/uploads

# 4. 暴露端口
EXPOSE 8080

# 5. 启动命令
ENTRYPOINT ["dotnet", "MyNextBlog.dll"]
