// 等待页面加载完成
document.addEventListener("DOMContentLoaded", function () {
    const editors = document.querySelectorAll('.markdown-editor');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('imageUploadInput');

    editors.forEach(editor => {
        // === 1. 粘贴上传 ===
        editor.addEventListener('paste', function (e) {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                    const blob = item.getAsFile();
                    e.preventDefault();
                    handleImageUpload(blob, editor);
                }
            }
        });

        // === 2. 拖拽上传 ===
        editor.addEventListener('dragover', function (e) {
            e.preventDefault(); // 必须阻止默认行为才能触发 drop
            e.stopPropagation();
            editor.style.border = "2px dashed #0d6efd"; // 给点视觉反馈
        });

        editor.addEventListener('dragleave', function(e) {
             e.preventDefault();
             e.stopPropagation();
             editor.style.border = "none"; // 恢复原样
        });

        editor.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            editor.style.border = "none";

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                // 处理所有拖入的文件（如果是图片）
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file.type.indexOf('image/') !== -1) {
                        handleImageUpload(file, editor);
                    }
                }
            }
        });
    });

    // === 3. 按钮点击上传 ===
    if (uploadBtn && fileInput) {
        // 点击按钮 -> 触发 input 点击
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // 监听文件选择
        fileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                // 假设只有一个编辑器，或者取第一个
                const editor = document.querySelector('.markdown-editor'); 
                if (editor) {
                     handleImageUpload(file, editor);
                }
                // 清空 input，确保下次选同一个文件也能触发 change
                this.value = ''; 
            }
        });
    }
});

// 通用：压缩并上传处理函数
function handleImageUpload(blob, editor) {
    // 使用 compressorjs 压缩图片
    new Compressor(blob, {
        quality: 0.8, // 压缩质量
        mimeType: 'image/webp', // 转为 WebP
        success(result) {
            uploadFile(result, editor);
        },
        error(err) {
            console.error('压缩失败:', err);
            uploadFile(blob, editor); // 失败则传原图
        },
    });
}

// 核心上传请求函数
function uploadFile(file, textarea) {
    const formData = new FormData();
    const fileName = file.name || "image.webp"; 
    formData.append('file', file, fileName);

    const uniqueId = "uploading-" + Math.random().toString(36).substr(2, 9);
    const placeholder = `![图片上传中... (${uniqueId})]()`;

    insertAtCursor(textarea, placeholder);

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) throw new Error('上传失败');
            return response.json();
        })
        .then(data => {
            const markdownImage = `![](${data.url})`;
            textarea.value = textarea.value.replace(placeholder, markdownImage);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('图片上传失败，请重试');
            textarea.value = textarea.value.replace(placeholder, `![上传失败]()`);
        });
}

// 辅助函数：在光标位置插入文字
function insertAtCursor(myField, myValue) {
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
        
        myField.selectionStart = startPos + myValue.length;
        myField.selectionEnd = startPos + myValue.length;
        myField.focus(); // 保持焦点
    } else {
        myField.value += myValue;
    }
}