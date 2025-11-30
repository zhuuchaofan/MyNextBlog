namespace ConsoleApp1
{
    static class Program
    {
        // 程序入口，注意这里我们要用 async Task Main
        static async Task Main(string[] args)
        {
            Console.WriteLine("=== 开始测试 R2 上传 ===");

            // 1. 实例化我们写的上传工具类
            var uploader = new R2Uploader();

            // 2. 准备参数
            // 本地文件的路径 (请修改为你电脑上真实存在的图片路径)
            string localFilePath = @"/Users/zhuchaofan/Downloads/壁纸文件/wallhaven-8g3xj1_3840x2160.png"; // Mac用户用类似 "/Users/name/test.jpg"

            // 在 R2 桶里保存的文件名 (你可以自定义)
            // 比如加上日期文件夹: "2025/test.jpg"
            string r2KeyName = "test-upload-001.jpg";

            // 3. 检查本地文件是否存在，防止报错
            if (!File.Exists(localFilePath))
            {
                Console.WriteLine($"错误：找不到本地文件 -> {localFilePath}");
                return;
            }

            // 4. 调用上传方法
            Console.WriteLine($"正在上传: {localFilePath} ...");
            await uploader.UploadFileAsync(localFilePath, r2KeyName);

            Console.WriteLine("=== 测试结束 ===");
            
            // 防止控制台一闪而过
            Console.ReadKey();
        }
    }

}