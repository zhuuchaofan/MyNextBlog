// 等待页面加载完成
document.addEventListener("DOMContentLoaded", function () {
    const editors = document.querySelectorAll('.markdown-editor');

    editors.forEach(editor => {
        editor.addEventListener('paste', function (e) {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;

            for (let index in items) {
                const item = items[index];

                // 如果粘贴的是图片
                if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                    const blob = item.getAsFile();

                    // 阻止默认粘贴行为
                    e.preventDefault();

                    // 使用 compressorjs 压缩图片
                    new Compressor(blob, {
                        quality: 0.8, // 压缩质量 0.8 (WebP默认会有损，但体积很小)
                        mimeType: 'image/webp', // 转为 WebP 格式
                        success(result) {
                            // 压缩成功，执行上传
                            // result 是一个 Blob 对象
                            uploadFile(result, editor);
                        },
                        error(err) {
                            console.error('压缩失败:', err);
                            // 如果压缩失败，尝试直接上传原图
                            uploadFile(blob, editor);
                        },
                    });
                }
            }
        });
    });
});

// 上传函数的具体实现
function uploadFile(file, textarea) {
    const formData = new FormData();
    // 文件名后缀改为 .webp (如果是压缩后的)
    const fileName = file.name || "image.webp"; 
    formData.append('file', file, fileName);

    // 生成唯一占位符 ID，防止多张图同时上传冲突
    const uniqueId = "uploading-" + Math.random().toString(36).substr(2, 9);
    const placeholder = `![图片上传中... (${uniqueId})]()`;

    // 在光标位置插入占位符
    insertAtCursor(textarea, placeholder);

    // 发送请求给后端的 UploadController
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) throw new Error('上传失败');
            return response.json();
        })
        .then(data => {
            // 上传成功，用 replace 替换掉特定的占位符
            // 真实的图片 Markdown
            const markdownImage = `![](${data.url})`;
            
            // 只替换当前这个唯一 ID 的占位符
            textarea.value = textarea.value.replace(placeholder, markdownImage);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('图片上传失败，请重试');
            // 失败了就把占位符标记为失败，或者删掉
            textarea.value = textarea.value.replace(placeholder, `![上传失败]()`);
        });
}

// 辅助函数：在光标位置插入文字
function insertAtCursor(myField, myValue) {
    // 现代浏览器支持 selectionStart
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
        
        // 插入后把光标移到插入内容的后面
        myField.selectionStart = startPos + myValue.length;
        myField.selectionEnd = startPos + myValue.length;
    } else {
        myField.value += myValue;
    }
}